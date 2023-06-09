import { MetricInterface } from "../../../types/metric";
import { createApiRequestHandler } from "../../util/handler";
import { updateMetric, UPDATEABLE_FIELDS } from "../../models/MetricModel";
import { PutMetricResponse } from "../../../types/openapi";

export const putMetric = createApiRequestHandler()(
  async (req): Promise<PutMetricResponse> => {
    const updates: Partial<MetricInterface> = {};
    UPDATEABLE_FIELDS.forEach((k) => {
      if (k in req.body) {
        // eslint-disable-next-line
        (updates as any)[k] = req.body[k];
      }
    });
    // @ts-expect-error TODO
    await updateMetric(req.params.id, updates, req.organization.id);
    return {
      updatedId: req.params.id,
    };
  }
);
