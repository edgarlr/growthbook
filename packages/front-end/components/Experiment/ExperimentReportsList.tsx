import { ReportInterface } from "back-end/types/report";
import Link from "next/link";
import React from "react";
import { ExperimentInterfaceStringDates } from "back-end/types/experiment";
import { useRouter } from "next/router";
import { ago, datetime } from "shared/dates";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/services/auth";
import usePermissions from "@/hooks/usePermissions";
import { useUser } from "@/services/UserContext";
import DeleteButton from "../DeleteButton/DeleteButton";
import Button from "../Button";
import { GBAddCircle } from "../Icons";
import { useSnapshot } from "./SnapshotProvider";
import { trackReport } from "@/services/track";
import { useDefinitions } from "@/services/DefinitionsContext";

export default function ExperimentReportsList({
  experiment,
}: {
  experiment: ExperimentInterfaceStringDates;
}) {
  const router = useRouter();
  const { apiCall } = useAuth();
  const permissions = usePermissions();
  const { userId, users } = useUser();
  const { snapshot } = useSnapshot();
  const { getDatasourceById } = useDefinitions();

  const { data, error, mutate } = useApi<{
    reports: ReportInterface[];
  }>(`/experiment/${experiment.id}/reports`);

  if (!experiment.datasource) return null;

  if (error) {
    return null;
  }
  if (!data) {
    return null;
  }

  const { reports } = data;

  if (!reports.length) {
    return null;
  }

  const hasData = (snapshot?.results?.[0]?.variations?.length ?? 0) > 0;
  const hasUserQuery = snapshot && !("skipPartialData" in snapshot);
  const canCreateReports =
    hasData &&
    snapshot?.queries &&
    !hasUserQuery &&
    permissions.check("createAnalyses", "");

  return (
    <div>
      <div className="row align-items-center mb-2">
        <div className="col">
          <h3 className="mb-0">Custom Reports</h3>
        </div>
        {canCreateReports && (
          <div className="col-auto">
            <Button
              className="btn btn-primary float-right"
              color="outline-info"
              onClick={async () => {
                const res = await apiCall<{ report: ReportInterface }>(
                  `/experiments/report/${snapshot.id}`,
                  {
                    method: "POST",
                  }
                );

                if (!res.report) {
                  throw new Error("Failed to create report");
                }
                trackReport(
                  "create", 
                  {
                    source: "NewCustomReportButton",
                    id: res.report.id,
                    experiment: res.report.experimentId ?? "",
                    engine: res.report.args.statsEngine || "bayesian",
                    datasource_type: getDatasourceById(res.report.args.datasource)?.type || null,
                    regression_adjustment_enabled: !!res.report.args.regressionAdjustmentEnabled,
                    sequential_testing_enabled: !!res.report.args.sequentialTestingEnabled,
                    sequential_testing_tuning_parameter:
                      res.report.args.sequentialTestingTuningParameter,
                    skip_partial_data: !!res.report.args.skipPartialData,
                    activation_metric_selected: !!res.report.args.activationMetric,
                    query_filter_selected: !!res.report.args.queryFilter,
                    segment_selected: !!res.report.args.segment,
                    dimension: res.report.args.dimension || "",
                  }
                )

                await router.push(`/report/${res.report.id}`);
              }}
            >
              <span className="h4 pr-2 m-0 d-inline-block align-top">
                <GBAddCircle />
              </span>
              New Custom Report
            </Button>
          </div>
        )}
      </div>
      <table className="table appbox gbtable table-hover mb-0">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th className="d-none d-md-table-cell">Last Updated </th>
            <th>By</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const user = report.userId ? users.get(report.userId) : null;
            const name = user ? user.name : "";
            return (
              <tr key={report.id} className="">
                <td
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/report/${report.id}`);
                  }}
                >
                  <Link href={`/report/${report.id}`}>
                    <a className={`text-dark font-weight-bold`}>
                      {report.title}
                    </a>
                  </Link>
                </td>
                <td
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/report/${report.id}`);
                  }}
                >
                  <Link href={`/report/${report.id}`}>
                    <a className={`text-dark`}>{report.description}</a>
                  </Link>
                </td>
                <td
                  title={datetime(report.dateUpdated)}
                  className="d-none d-md-table-cell"
                >
                  {ago(report.dateUpdated)}
                </td>
                <td>{name}</td>
                <td style={{ width: 50 }}>
                  {(permissions.superDelete || report.userId === userId) && (
                    <>
                      <DeleteButton
                        displayName="Custom Report"
                        link={true}
                        className="fade-hover"
                        text=""
                        useIcon={true}
                        onClick={async () => {
                          await apiCall<{ status: number; message?: string }>(
                            `/report/${report.id}`,
                            {
                              method: "DELETE",
                              //body: JSON.stringify({ id: report.id }),
                            }
                          );
                          trackReport(
                            "delete", 
                            {
                              source: "ExperimentReportsList", 
                              id: report.id,
                              experiment: report.experimentId ?? "",
                              engine: report.args.statsEngine || "bayesian",
                              datasource_type: getDatasourceById(report.args.datasource)?.type || null,
                              regression_adjustment_enabled: !!report.args.regressionAdjustmentEnabled,
                              sequential_testing_enabled: !!report.args.sequentialTestingEnabled,
                              sequential_testing_tuning_parameter:
                                report.args.sequentialTestingTuningParameter,
                              skip_partial_data: !!report.args.skipPartialData,
                              activation_metric_selected: !!report.args.activationMetric,
                              query_filter_selected: !!report.args.queryFilter,
                              segment_selected: !!report.args.segment,
                              dimension: report.args.dimension || "",
                              }
                            );
                          mutate();
                        }}
                      />
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {!reports.length && (
            <tr>
              <td colSpan={3} align={"center"}>
                No custom reports created
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
