import type { Incident, Alert, WorkOrder, UnifiedEvent } from "./types";
import { TASKS, TRAINS, SECTIONS } from "./data";
import { generateStationIncidents } from "./operations";

// Simulated unified data layer that correlates records from multiple systems
export class UnifiedDataLayer {
  // Correlate data from TMS, TDMS, SMMS, COA based on station, train, asset, location
  static correlateEvents(): UnifiedEvent[] {
    const events: UnifiedEvent[] = [];

    // Example: Correlate a train approaching with track restriction
    const trainApproaching = TRAINS.find((t) => t.id === "12951");
    const trackRestriction = TASKS.find((t) => t.id === "ENG-101");
    const signalIssue = TASKS.find((t) => t.id === "SNT-202");

    if (trainApproaching && trackRestriction && signalIssue) {
      events.push({
        id: "UE-001",
        type: "MULTI-SYSTEM",
        severity: "CRITICAL",
        timestamp: new Date().toISOString(),
        description: "TRAIN 12945 MAY BE AFFECTED BY MULTI-SYSTEM CONDITIONS",
        relatedSystems: ["COA", "TMS", "SMMS", "TDMS"],
        affectedTrains: [trainApproaching.id],
        affectedAssets: [trackRestriction.id, signalIssue.id],
        location: "S1 · NDG-KRP",
        correlationDetails: {
          coa: `Train ${trainApproaching.id} approaching station`,
          tms: `Track section ${trackRestriction.section} has maintenance restriction`,
          smms: `Signal S-204 abnormal`,
          tdms: "OHE maintenance scheduled",
        },
      });
    }

    return events;
  }

  // Generate unified incidents from correlated events
  static generateIncidents(): Incident[] {
    return generateStationIncidents(56).map((incident) => ({
      id: incident.id,
      location: incident.location,
      relatedSystems: [incident.department],
      impact: [incident.title, "Train operations"],
      severity: incident.severity.toUpperCase() as Incident["severity"],
      affectedTrains: incident.affectedTrains.length,
      affectedAssets: 1,
      assignedDepartments: [incident.department],
      timeline: [
        { time: new Date(incident.timestamp).toLocaleTimeString("en-GB"), event: incident.title },
      ],
      status: incident.status === "Acknowledged" ? "In Progress" : incident.status,
      createdAt: incident.timestamp,
    }));
  }

  // Generate alerts from all systems
  static generateAlerts(): Alert[] {
    return [
      {
        id: "ALT-001",
        timestamp: new Date().toISOString(),
        sourceSystem: "SMMS",
        station: "NDG",
        location: "KM 104/7",
        asset: "S-204",
        description: "Signal S-204 lamp failure detected",
        severity: "CRITICAL",
        affectedTrains: ["12951", "12841", "12615"],
        assignedDepartment: "Signal",
        status: "Open",
      },
      {
        id: "ALT-002",
        timestamp: new Date().toISOString(),
        sourceSystem: "TMS",
        station: "NDG",
        location: "S1 · NDG-KRP",
        asset: "Track",
        description: "Track geometry abnormality detected at KM 45/2",
        severity: "HIGH",
        affectedTrains: ["12951", "12615"],
        assignedDepartment: "Track",
        status: "Open",
      },
      {
        id: "ALT-003",
        timestamp: new Date().toISOString(),
        sourceSystem: "TDMS",
        station: "KRP",
        location: "SS-002",
        asset: "Substation",
        description: "Substation SS-002 showing warning condition",
        severity: "MEDIUM",
        affectedTrains: [],
        assignedDepartment: "Traction",
        status: "Open",
      },
      {
        id: "ALT-004",
        timestamp: new Date().toISOString(),
        sourceSystem: "COA",
        station: "NDG",
        location: "Platform 2",
        asset: "Platform",
        description: "Train 12951 delayed by 18 minutes",
        severity: "MEDIUM",
        affectedTrains: ["12951"],
        assignedDepartment: "Control",
        status: "Acknowledged",
      },
      {
        id: "ALT-005",
        timestamp: new Date().toISOString(),
        sourceSystem: "TMS",
        station: "STP",
        location: "S3 · STP-DVR",
        asset: "Track",
        description: "Routine track inspection due",
        severity: "LOW",
        affectedTrains: [],
        assignedDepartment: "Track",
        status: "Open",
      },
    ];
  }

  // Generate work orders from maintenance tasks
  static generateWorkOrders(): WorkOrder[] {
    return TASKS.slice(0, 5).map((task) => ({
      id: `WO-2026-${task.id.split("-")[1]}`,
      source:
        task.department === "Engineering" ? "TMS" : task.department === "S&T" ? "SMMS" : "TDMS",
      asset: `${task.assetType} ${task.section}`,
      issue: task.workType,
      priority:
        task.criticality === "Critical"
          ? "P1"
          : task.criticality === "High"
            ? "P2"
            : task.criticality === "Medium"
              ? "P3"
              : "P4",
      assigned: task.requiredResources[0] || "Unassigned",
      scheduled: "02:10–02:55",
      dependencies: ["COA traffic window", "Track block", "Maintenance vehicle"],
      status: task.status,
      createdAt: new Date().toISOString(),
    }));
  }
}
