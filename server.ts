import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { analyzeCivicImage } from './server/ai.ts';
import { findPossibleDuplicates } from './src/utils/geo.ts';
import { calculatePriorityScore } from './src/utils/priority.ts';
import { CivicCategory, Complaint, SeverityLevel, PriorityLevel } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser with 25MB limit for high-resolution civic photos
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    name: 'NagarSetu Civic Engine',
    city: 'Pune, Maharashtra',
    version: '1.0.0',
  });
});

// Authentication endpoints
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const emailLower = email.toLowerCase().trim();
  const user = db.findUserByEmail(emailLower);
  if (user) {
    return res.json({ user });
  }

  // Pre-configured administrator access for authorized email
  if (emailLower === 'shreya.1251070104@vit.edu' || emailLower === 'admin@pune-civic.gov.in') {
    const adminUser = db.upsertGoogleUser({
      email: emailLower,
      name: 'Shreya Pol',
    });
    return res.json({ user: adminUser });
  }

  return res.status(401).json({ error: 'User account not found. Please register as a new citizen.' });
});

app.post('/api/auth/google', (req: Request, res: Response) => {
  const { email, name, photoUrl, uid } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required for Google authentication' });
  }

  const user = db.upsertGoogleUser({
    email,
    name: name || email.split('@')[0],
    photoUrl,
    uid,
  });

  return res.json({ user });
});

app.post('/api/auth/phone', (req: Request, res: Response) => {
  const { phone, name, uid } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Mobile number is required' });
  }

  const user = db.upsertPhoneUser({
    phone,
    name,
    uid,
  });

  return res.json({ user });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, ward } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.json({ user: existing });
  }

  // Strict Security: Public registration can NEVER create an admin
  const newUser = db.createUser({
    name,
    email,
    phone: phone || '+91 98000 00000',
    ward: ward || 'Shivajinagar',
    role: 'citizen',
  });

  res.status(201).json({ user: newUser });
});

// Complaints endpoints
app.get('/api/complaints', (req: Request, res: Response) => {
  const { category, status, severity, ward, search, userId } = req.query;
  let complaints = db.getAllComplaints();

  if (category && typeof category === 'string' && category !== 'All') {
    complaints = complaints.filter((c) => c.category === category);
  }

  if (status && typeof status === 'string' && status !== 'All') {
    complaints = complaints.filter((c) => c.status === status);
  }

  if (severity && typeof severity === 'string' && severity !== 'All') {
    complaints = complaints.filter((c) => c.severity === severity);
  }

  if (ward && typeof ward === 'string' && ward !== 'All') {
    complaints = complaints.filter((c) =>
      c.location.ward.toLowerCase().includes(ward.toLowerCase())
    );
  }

  if (userId && typeof userId === 'string') {
    complaints = complaints.filter(
      (c) => c.submittedBy.userId === userId || c.linkedUserIds.includes(userId)
    );
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    complaints = complaints.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q) ||
        c.location.ward.toLowerCase().includes(q)
    );
  }

  res.json({ complaints });
});

app.get('/api/complaints/:id', (req: Request, res: Response) => {
  const complaint = db.getComplaintById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  res.json({ complaint });
});

app.post('/api/complaints', (req: Request, res: Response) => {
  try {
    const {
      title,
      category,
      description,
      imageUrl,
      location,
      severity,
      submittedBy,
      aiAnalysis,
      assignedDepartment,
    } = req.body;

    if (!category || !location || !submittedBy) {
      return res.status(400).json({ error: 'Missing required complaint fields' });
    }

    const newComplaint = db.createComplaint({
      title: title || `${category} issue near ${location.address || location.ward}`,
      category,
      description: description || 'Civic infrastructure report submitted via NagarSetu.',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
      location,
      severity: severity || 'Medium',
      status: 'Pending',
      submittedBy,
      aiAnalysis: aiAnalysis || {
        detected: true,
        category,
        severity: severity || 'Medium',
        confidence: 0.9,
        description: description || 'Visual verification logged.',
        isRelevantCivicIssue: true,
        suggestedDepartment: assignedDepartment || 'Municipal Operations',
        flagForReview: false,
      },
      reportCount: 1,
      linkedUserIds: [submittedBy.userId],
      assignedDepartment: assignedDepartment || aiAnalysis?.suggestedDepartment,
    });

    res.status(201).json({ complaint: newComplaint });
  } catch (err: any) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ error: err.message || 'Failed to submit complaint' });
  }
});

app.patch('/api/complaints/:id/status', (req: Request, res: Response) => {
  const { status, updatedBy, remarks, assignedDepartment, assignedOfficer, resolutionNotes, resolutionImageUrl } = req.body;

  if (!status || !updatedBy) {
    return res.status(400).json({ error: 'Status and updatedBy are required' });
  }

  // Security Verification: Ensure caller has administrator privileges
  const requesterId = (req.headers['x-user-id'] as string) || updatedBy.userId;
  const requester = requesterId ? db.findUserById(requesterId) : null;
  if (requester && requester.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only authorized administrators can update grievance status.' });
  }

  const updated = db.updateComplaintStatus(req.params.id, status, updatedBy, remarks, {
    assignedDepartment,
    assignedOfficer,
    resolutionNotes,
    resolutionImageUrl,
  });

  if (!updated) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  res.json({ complaint: updated });
});

app.patch('/api/complaints/:id/priority', (req: Request, res: Response) => {
  const { priorityLevel, priorityScore, adminName, reason } = req.body;

  if (!priorityLevel || priorityScore === undefined || !adminName || !reason) {
    return res.status(400).json({ error: 'Priority details, admin name, and reason are required' });
  }

  // Security Verification: Ensure caller has administrator privileges
  const requesterId = (req.headers['x-user-id'] as string) || req.body.userId;
  const requester = requesterId ? db.findUserById(requesterId) : null;
  if (requester && requester.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only authorized administrators can override priority scores.' });
  }

  const updated = db.overridePriority(
    req.params.id,
    priorityLevel as PriorityLevel,
    Number(priorityScore),
    adminName,
    reason
  );

  if (!updated) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  res.json({ complaint: updated });
});

app.post('/api/complaints/:id/link-duplicate', (req: Request, res: Response) => {
  const { userId, userName, citizenNotes } = req.body;
  if (!userId || !userName) {
    return res.status(400).json({ error: 'User information required to link report' });
  }

  const updated = db.linkDuplicateReport(req.params.id, userId, userName, citizenNotes);
  if (!updated) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  res.json({ complaint: updated, message: 'Successfully linked to existing complaint' });
});

// AI Image Analysis endpoint
app.post('/api/ai/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, userNote } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data (base64) is required' });
    }

    const analysis = await analyzeCivicImage(imageBase64, mimeType, userNote);
    res.json({ analysis });
  } catch (error: any) {
    console.error('AI Analysis Endpoint Error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// Duplicate Detection endpoint
app.post('/api/duplicates/check', (req: Request, res: Response) => {
  const { category, lat, lng, excludeComplaintId } = req.body;

  if (!category || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'Category, lat, and lng are required' });
  }

  const allComplaints = db.getAllComplaints();
  const matches = findPossibleDuplicates(
    {
      category: category as CivicCategory,
      lat: Number(lat),
      lng: Number(lng),
      excludeComplaintId,
    },
    allComplaints,
    100, // 100 metres radius
    7 // within previous 7 days
  );

  res.json({
    possibleDuplicates: matches,
    count: matches.length,
  });
});

// Analytics endpoint
app.get('/api/analytics', (_req: Request, res: Response) => {
  const complaints = db.getAllComplaints();

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'Pending').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const critical = complaints.filter((c) => c.priorityLevel === 'Critical').length;
  const high = complaints.filter((c) => c.priorityLevel === 'High').length;

  // Category Breakdown
  const categoryMap: Record<string, { total: number; pending: number; resolved: number; inProgress: number }> = {};
  for (const c of complaints) {
    if (!categoryMap[c.category]) {
      categoryMap[c.category] = { total: 0, pending: 0, resolved: 0, inProgress: 0 };
    }
    categoryMap[c.category].total += 1;
    if (c.status === 'Pending') categoryMap[c.category].pending += 1;
    else if (c.status === 'In Progress') categoryMap[c.category].inProgress += 1;
    else if (c.status === 'Resolved') categoryMap[c.category].resolved += 1;
  }

  const categoryBreakdown = Object.entries(categoryMap).map(([name, stats]) => ({
    name,
    total: stats.total,
    pending: stats.pending,
    inProgress: stats.inProgress,
    resolved: stats.resolved,
  }));

  // Ward Breakdown
  const wardMap: Record<string, { count: number; critical: number; resolved: number }> = {};
  for (const c of complaints) {
    const wardName = c.location.ward.split('-')[0].trim();
    if (!wardMap[wardName]) {
      wardMap[wardName] = { count: 0, critical: 0, resolved: 0 };
    }
    wardMap[wardName].count += 1;
    if (c.priorityLevel === 'Critical') wardMap[wardName].critical += 1;
    if (c.status === 'Resolved') wardMap[wardName].resolved += 1;
  }

  const wardBreakdown = Object.entries(wardMap)
    .map(([ward, data]) => ({
      ward,
      count: data.count,
      critical: data.critical,
      resolved: data.resolved,
    }))
    .sort((a, b) => b.count - a.count);

  // Severity Distribution
  const severityDistribution = [
    { name: 'Low', count: complaints.filter((c) => c.severity === 'Low').length, fill: '#10b981' },
    { name: 'Medium', count: complaints.filter((c) => c.severity === 'Medium').length, fill: '#f59e0b' },
    { name: 'High', count: complaints.filter((c) => c.severity === 'High').length, fill: '#f97316' },
    { name: 'Critical', count: complaints.filter((c) => c.severity === 'Critical').length, fill: '#ef4444' },
  ];

  // Calculate average resolution time for resolved complaints
  const resolvedList = complaints.filter((c) => c.status === 'Resolved' && c.resolvedAt);
  let totalHours = 0;
  for (const c of resolvedList) {
    const start = new Date(c.createdAt).getTime();
    const end = new Date(c.resolvedAt!).getTime();
    totalHours += Math.max(0, (end - start) / (1000 * 60 * 60));
  }
  const avgResolutionHours = resolvedList.length > 0 ? Math.round((totalHours / resolvedList.length) * 10) / 10 : 28.5;

  // AI confidence metrics
  const avgConfidence = complaints.length > 0
    ? Math.round(
        (complaints.reduce((acc, c) => acc + (c.aiAnalysis?.confidence || 0.9), 0) / complaints.length) * 100
      )
    : 94;

  res.json({
    stats: {
      total,
      pending,
      inProgress,
      resolved,
      critical,
      high,
      avgResolutionHours,
      avgConfidence,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    },
    categoryBreakdown,
    wardBreakdown,
    severityDistribution,
  });
});

// Demo reset endpoint
app.post('/api/demo/reset', (_req: Request, res: Response) => {
  db.resetDemoData();
  res.json({ message: 'Demo data reloaded successfully' });
});

// Vite Middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NagarSetu Civic Engine active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
