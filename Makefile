PYTHON ?= python

.PHONY: test train-all phase4 phase5 nightly-refresh nightly-refresh-dry-run

test:
	$(PYTHON) -m pytest ml/tests

train-all:
	$(PYTHON) ml/scripts/run_all_pipelines.py

phase4:
	$(PYTHON) ml/scripts/run_phase4_modeling_framework.py

phase5:
	$(PYTHON) ml/scripts/build_phase5_notebooks.py
	$(PYTHON) ml/scripts/export_for_api.py

nightly-refresh:
	$(PYTHON) ml/scripts/refresh_supabase_ml.py

nightly-refresh-dry-run:
	$(PYTHON) ml/scripts/refresh_supabase_ml.py --dry-run
