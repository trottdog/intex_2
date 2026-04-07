PYTHON ?= python

.PHONY: test train-all phase4 phase5

test:
	$(PYTHON) -m pytest ml/tests

train-all:
	$(PYTHON) ml/scripts/run_all_pipelines.py

phase4:
	$(PYTHON) ml/scripts/run_phase4_modeling_framework.py

phase5:
	$(PYTHON) ml/scripts/build_phase5_notebooks.py
	$(PYTHON) ml/scripts/export_for_api.py
