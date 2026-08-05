import type { Release } from "./schema";

export interface MetricCompatibility {
  allowed: boolean;
  reason: string;
}

export function compareMetricCompatibility(
  left: Release,
  right: Release,
  metricId: string,
): MetricCompatibility {
  const leftMetric = left.metrics.find(({ id }) => id === metricId);
  const leftLineage = left.compatibility.metricLineage.find(
    ({ metricId: candidate }) => candidate === metricId,
  );
  if (!leftMetric || !leftLineage) {
    return {
      allowed: false,
      reason: `Metric ${metricId} is not declared by ${left.name}.`,
    };
  }

  const rightLineage = right.compatibility.metricLineage.find(
    (candidate) =>
      candidate.metricId === metricId ||
      candidate.lineageId === leftLineage.lineageId ||
      leftLineage.compatibleWith.includes(candidate.lineageId) ||
      leftLineage.incompatibleWith.includes(candidate.lineageId) ||
      candidate.compatibleWith.includes(leftLineage.lineageId) ||
      candidate.incompatibleWith.includes(leftLineage.lineageId),
  );
  if (!rightLineage) {
    return {
      allowed: false,
      reason: `${right.name} declares no corresponding lineage for ${metricId}.`,
    };
  }
  const rightMetric = right.metrics.find(
    ({ id }) => id === rightLineage.metricId,
  );
  if (!rightMetric) {
    return {
      allowed: false,
      reason: `${right.name} has incomplete metric lineage for ${rightLineage.metricId}.`,
    };
  }

  if (
    leftLineage.incompatibleWith.includes(rightLineage.lineageId) ||
    rightLineage.incompatibleWith.includes(leftLineage.lineageId)
  ) {
    return {
      allowed: false,
      reason: `Metric ${metricId} cannot compare ${left.compatibility.referenceSetType} with ${right.compatibility.referenceSetType}.`,
    };
  }

  const leftAllows =
    leftLineage.lineageId === rightLineage.lineageId ||
    leftLineage.compatibleWith.includes(rightLineage.lineageId);
  const rightAllows =
    rightLineage.lineageId === leftLineage.lineageId ||
    rightLineage.compatibleWith.includes(leftLineage.lineageId);
  if (!leftAllows || !rightAllows) {
    return {
      allowed: false,
      reason: `Metric lineage compatibility is not mutually declared for ${leftLineage.lineageId} and ${rightLineage.lineageId}.`,
    };
  }
  if (leftMetric.unit !== rightMetric.unit) {
    return {
      allowed: false,
      reason: `Metric units differ: ${leftMetric.unit} versus ${rightMetric.unit}.`,
    };
  }
  if (
    leftMetric.definition !== rightMetric.definition ||
    leftMetric.aggregation !== rightMetric.aggregation
  ) {
    return {
      allowed: false,
      reason: `Metric definitions or aggregations differ for ${leftLineage.lineageId}.`,
    };
  }

  return {
    allowed: true,
    reason: `Both releases explicitly declare ${leftLineage.lineageId} compatible with matching ${leftMetric.unit} units.`,
  };
}
