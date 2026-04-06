PYTHON ?= python

.PHONY: test train-all

test:
	$(PYTHON) -m pytest ml/tests

train-all:
	$(PYTHON) ml/scripts/run_all_pipelines.py
