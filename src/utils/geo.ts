import { Complaint, DuplicateMatch, CivicCategory } from '../types/index.ts';

/**
 * Calculates distance between two coordinates in metres using Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in metres
}

/**
 * Checks for duplicate complaints based on:
 * - Same or similar category
 * - Location within approximately 100 metres
 * - Reports within previous 7 days
 * - Existing complaint must not be resolved
 */
export function findPossibleDuplicates(
  newReport: {
    category: CivicCategory;
    lat: number;
    lng: number;
    excludeComplaintId?: string;
  },
  existingComplaints: Complaint[],
  maxDistanceMetres = 100,
  maxAgeDays = 7
): DuplicateMatch[] {
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const matches: DuplicateMatch[] = [];

  for (const complaint of existingComplaints) {
    if (newReport.excludeComplaintId && complaint.id === newReport.excludeComplaintId) {
      continue;
    }

    // Must not be resolved
    if (complaint.status === 'Resolved') {
      continue;
    }

    // Must be within previous 7 days
    const complaintTime = new Date(complaint.createdAt).getTime();
    const ageMs = now - complaintTime;
    if (ageMs > maxAgeMs) {
      continue;
    }

    // Must be same or compatible category
    const isCategoryMatch = complaint.category === newReport.category;
    if (!isCategoryMatch) {
      continue;
    }

    // Calculate distance
    const distance = calculateHaversineDistance(
      newReport.lat,
      newReport.lng,
      complaint.location.lat,
      complaint.location.lng
    );

    if (distance <= maxDistanceMetres) {
      const timeDifferenceDays = Math.round((ageMs / (1000 * 60 * 60 * 24)) * 10) / 10;
      // Distance score (closer = higher)
      const distanceFactor = Math.max(0, (maxDistanceMetres - distance) / maxDistanceMetres);
      const similarityScore = Math.round((0.7 * distanceFactor + 0.3 * (1 - timeDifferenceDays / 7)) * 100);

      matches.push({
        existingComplaint: complaint,
        distanceMeters: distance,
        timeDifferenceDays,
        similarityScore,
      });
    }
  }

  // Sort by closest distance first
  return matches.sort((a, b) => a.distanceMeters - b.distanceMeters);
}
