PYTHON ?= python

.PHONY: test train-all

test:
	$(PYTHON) -m pytest tests

train-all:
	$(PYTHON) scripts/run_all_pipelines.py
