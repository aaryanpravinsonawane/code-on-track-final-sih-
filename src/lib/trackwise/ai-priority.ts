import type { Alert, MaintenanceTask, Train } from "./types";
import { TASKS, TRAINS } from "./data";

export interface AIPriorityScore {
  score: number;
  level: "P1" | "P2" | "P3" | "P4";
  confidence: number;
  factors: {
    safetyImpact: number;
    trainImpact: number;
    assetCriticality: number;
    affectedTrains: number;
    timeToFailure: number;
    delayImpact: number;
    location: number;
    maintenanceUrgency: number;
    resourceAvailability: number;
    historicalRisk: number;
    operationalConditions: number;
  };
  reason: string;
  recommendedAction: string;
}

export interface AIPriorityItem {
  id: string;
  type: "Signal failure" | "Track defect" | "OHE warning" | "Maintenance" | "Administrative";
  priority: "P1" | "P2" | "P3" | "P4";
  description: string;
  system: "TMS" | "TDMS" | "SMMS" | "COA" | "Station";
  score: AIPriorityScore;
  affectedTrains: number;
  timestamp: string;
}

// AI Priority Engine - Scoring Model
export class AIPriorityEngine {
  static calculatePriorityScore(
    task: MaintenanceTask,
    affectedTrains: Train[] = []
  ): AIPriorityScore {
    // Factor weights (sum = 100)
    const weights = {
      safetyImpact: 25,
      trainImpact: 20,
      assetCriticality: 15,
      affectedTrains: 10,
      timeToFailure: 10,
      delayImpact: 8,
      location: 5,
      maintenanceUrgency: 4,
      resourceAvailability: 2,
      historicalRisk: 1,
    };

    // Calculate individual factor scores (0-10)
    const factors = {
      safetyImpact: this.getSafetyImpact(task),
      trainImpact: this.getTrainImpact(task, affectedTrains),
      assetCriticality: this.getAssetCriticality(task),
      affectedTrains: this.getAffectedTrainsScore(affectedTrains.length),
      timeToFailure: this.getTimeToFailure(task),
      delayImpact: this.getDelayImpact(task, affectedTrains),
      location: this.getLocationScore(task),
      maintenanceUrgency: this.getMaintenanceUrgency(task),
      resourceAvailability: this.getResourceAvailability(task),
      historicalRisk: this.getHistoricalRisk(task),
    };

    // Calculate weighted score
    let totalScore = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      totalScore += (factors[key as keyof typeof factors] / 10) * weight;
    });

    // Determine priority level
    let level: "P1" | "P2" | "P3" | "P4";
    if (totalScore >= 80) level = "P1";
    else if (totalScore >= 60) level = "P2";
    else if (totalScore >= 40) level = "P3";
    else level = "P4";

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(task, affectedTrains);

    // Generate reason and recommendation
    const reason = this.generateReason(task, factors, totalScore);
    const recommendedAction = this.generateRecommendation(level, task, factors);

    return {
      score: Math.round(totalScore),
      level,
      confidence,
      factors,
      reason,
      recommendedAction,
    };
  }

  private static getSafetyImpact(task: MaintenanceTask): number {
    if (task.criticality === "Critical") return 10;
    if (task.criticality === "High") return 8;
    if (task.criticality === "Medium") return 5;
    return 2;
  }

  private static getTrainImpact(task: MaintenanceTask, affectedTrains: Train[]): number {
    if (affectedTrains.length === 0) return 2;
    const highPriorityTrains = affectedTrains.filter((t) => t.priority <= 2).length;
    if (highPriorityTrains > 0) return 10;
    if (affectedTrains.length > 3) return 8;
    if (affectedTrains.length > 1) return 6;
    return 4;
  }

  private static getAssetCriticality(task: MaintenanceTask): number {
    if (task.assetType === "Signal" || task.assetType === "Point Machine") return 10;
    if (task.assetType === "Track" || task.assetType === "OHE") return 8;
    if (task.assetType === "Bridge" || task.assetType === "Points") return 7;
    return 5;
  }

  private static getAffectedTrainsScore(count: number): number {
    if (count === 0) return 0;
    if (count >= 5) return 10;
    if (count >= 3) return 8;
    if (count >= 2) return 6;
    return 4;
  }

  private static getTimeToFailure(task: MaintenanceTask): number {
    if (task.overdueDays > 10) return 10;
    if (task.overdueDays > 5) return 8;
    if (task.overdueDays > 0) return 6;
    if (task.urgency >= 8) return 7;
    if (task.urgency >= 5) return 4;
    return 2;
  }

  private static getDelayImpact(task: MaintenanceTask, affectedTrains: Train[]): number {
    if (affectedTrains.length === 0) return 2;
    const avgPriority = affectedTrains.reduce((sum, t) => sum + t.priority, 0) / affectedTrains.length;
    if (avgPriority <= 2) return 10;
    if (avgPriority <= 3) return 7;
    return 4;
  }

  private static getLocationScore(task: MaintenanceTask): number {
    // High traffic sections get higher scores
    if (task.section === "S1" || task.section === "S3") return 8;
    if (task.section === "S2") return 6;
    return 4;
  }

  private static getMaintenanceUrgency(task: MaintenanceTask): number {
    return task.urgency;
  }

  private static getResourceAvailability(task: MaintenanceTask): number {
    // In real system, check actual resource availability
    // For simulation, assume 80% availability
    return 8;
  }

  private static getHistoricalRisk(task: MaintenanceTask): number {
    // In real system, check historical failure patterns
    // For simulation, use moderate risk
    return 5;
  }

  private static calculateConfidence(task: MaintenanceTask, affectedTrains: Train[]): number {
    let dataPoints = 0;
    if (task.criticality) dataPoints++;
    if (task.urgency) dataPoints++;
    if (task.overdueDays !== undefined) dataPoints++;
    if (task.assetType) dataPoints++;
    if (affectedTrains.length > 0) dataPoints++;

    const maxDataPoints = 5;
    return Math.round((dataPoints / maxDataPoints) * 100);
  }

  private static generateReason(
    task: MaintenanceTask,
    factors: AIPriorityScore["factors"],
    score: number
  ): string {
    const reasons: string[] = [];

    if (factors.safetyImpact >= 8) reasons.push("Critical safety impact");
    if (factors.trainImpact >= 8) reasons.push("Multiple trains affected");
    if (factors.assetCriticality >= 8) reasons.push("High asset criticality");
    if (factors.timeToFailure >= 8) reasons.push("Urgent maintenance required");
    if (factors.location >= 8) reasons.push("High-traffic location");

    if (reasons.length === 0) reasons.push("Routine maintenance priority");

    return reasons.join(" + ");
  }

  private static generateRecommendation(
    level: "P1" | "P2" | "P3" | "P4",
    task: MaintenanceTask,
    factors: AIPriorityScore["factors"]
  ): string {
    if (level === "P1") {
      return `Immediately notify Station Master and ${task.department} Department. Evaluate operational restriction according to authorized railway procedures.`;
    }
    if (level === "P2") {
      return `Schedule within next available maintenance window. Coordinate with ${task.department} team and Control Office.`;
    }
    if (level === "P3") {
      return `Plan for routine maintenance within standard timeline. Monitor conditions.`;
    }
    return "Low priority - can be scheduled during standard maintenance periods.";
  }

  // Generate AI Priority Queue
  static generatePriorityQueue(): AIPriorityItem[] {
    const queue: AIPriorityItem[] = [];

    // Add high-priority items from different systems
    queue.push({
      id: "AI-001",
      type: "Signal failure",
      priority: "P1",
      description: "Signal S-204 abnormal while train approaching",
      system: "SMMS",
      score: this.calculatePriorityScore(TASKS.find((t) => t.id === "SNT-202")!, TRAINS.slice(0, 3)),
      affectedTrains: 3,
      timestamp: new Date().toISOString(),
    });

    queue.push({
      id: "AI-002",
      type: "Track defect",
      priority: "P1",
      description: "Track geometry abnormality on high-speed route",
      system: "TMS",
      score: this.calculatePriorityScore(TASKS.find((t) => t.id === "ENG-101")!, TRAINS.slice(2, 7)),
      affectedTrains: 5,
      timestamp: new Date().toISOString(),
    });

    queue.push({
      id: "AI-003",
      type: "OHE warning",
      priority: "P2",
      description: "OHE inspection overdue on section S2",
      system: "TDMS",
      score: this.calculatePriorityScore(TASKS.find((t) => t.id === "TRD-304")!, []),
      affectedTrains: 0,
      timestamp: new Date().toISOString(),
    });

    queue.push({
      id: "AI-004",
      type: "Track defect",
      priority: "P2",
      description: "Track geometry warning on section S3",
      system: "TMS",
      score: this.calculatePriorityScore(TASKS.find((t) => t.id === "ENG-107")!, TRAINS.slice(4, 6)),
      affectedTrains: 2,
      timestamp: new Date().toISOString(),
    });

    queue.push({
      id: "AI-005",
      type: "Maintenance",
      priority: "P3",
      description: "Routine maintenance due on signal equipment",
      system: "SMMS",
      score: this.calculatePriorityScore(TASKS.find((t) => t.id === "SNT-209")!, []),
      affectedTrains: 0,
      timestamp: new Date().toISOString(),
    });

    queue.push({
      id: "AI-006",
      type: "Administrative",
      priority: "P4",
      description: "Administrative work order processing",
      system: "Station",
      score: this.calculatePriorityScore(TASKS.find((t) => t.id === "ENG-110")!, []),
      affectedTrains: 0,
      timestamp: new Date().toISOString(),
    });

    return queue.sort((a, b) => b.score.score - a.score.score);
  }

  // Filter priority queue
  static filterQueue(queue: AIPriorityItem[], filter: string): AIPriorityItem[] {
    if (filter === "All") return queue;
    if (filter.startsWith("P")) return queue.filter((item) => item.priority === filter);
    return queue.filter((item) => item.system === filter);
  }
}
