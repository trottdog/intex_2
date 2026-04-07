# Phase B Notebook Standardization

## Objective
- Turn the existing shared ML platform into a repeatable notebook factory for expansion work.
- Keep predictive and explanatory submissions structurally consistent while letting each pipeline stay distinct in business framing.

## Shared Modules
* `ml/src/pipelines/notebook_support.py`
* `ml/src/pipelines/notebook_factory.py`
* `ml/scripts/build_phase5_notebooks.py`
* `ml/scripts/run_phase_b_notebook_standardization.py`

## Standard Predictive Notebook Sections
1. Problem Framing
2. Shared Assets And Notebook Bootstrap
3. Target And Leakage Checklist
4. Standard Model Comparison Outputs
5. Business Interpretation
6. Deployment Notes

## Standard Explanatory Notebook Sections
1. Problem Framing
2. Shared Assets And Notebook Bootstrap
3. Standard Analysis Plan
4. Evidence Review
5. Business Interpretation
6. Deployment Notes

## Standard Model Comparison Outputs
* `ml/reports/evaluation/<pipeline>_metrics.json`
* `ml/reports/evaluation/phase4_holdout_comparison.csv`
* `ml/reports/evaluation/phase4_cv_summary.csv`

## Registry Metadata Now Driving Notebook Generation
| pipeline | predictive_impl | dataset | target_summary | recommended_widgets |
| --- | --- | --- | --- | --- |
| donation_uplift |  | campaign_features | Candidate target: campaign-period lift in donation value, donor count, or average gift. | explanation_chart_card, insight_summary_card, recommendation_panel |
| donor_retention | donor_retention | supporter_features | Current predictive label: `label_lapsed_180d` from supporter snapshots. | ranked_table_widget, risk_badge_widget, recommendation_panel |
| reintegration_readiness | reintegration_readiness | resident_monthly_features | Current predictive label: `label_reintegration_complete_next_90d` from resident-monthly snapshots. | ranked_table_widget, insight_summary_card, recommendation_panel |
| resident_risk | resident_risk | resident_monthly_features | Current predictive label: `label_incident_next_30d` from resident-monthly snapshots. | risk_badge_widget, ranked_table_widget, explanation_chart_card |
| safehouse_outcomes |  | safehouse_features | Candidate target: safehouse-level resident outcome or operating-performance composite. | explanation_chart_card, insight_summary_card, ranked_table_widget |
| social_media_conversion | social_media_conversion | post_features | Current predictive label: `label_donation_referral_positive` from post-level social data. | ranked_table_widget, explanation_chart_card, insight_summary_card |

## Commands
* `py -3 ml/scripts/run_phase_b_notebook_standardization.py`
* `py -3 ml/scripts/build_phase5_notebooks.py`
