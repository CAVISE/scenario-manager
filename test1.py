import importlib
import os

import sys 
sys.path.append('..')
scenario = "map10"
testing_scenario = importlib.import_module(
    f"scenario-manager.opencda.scenario_testing.{scenario}", "map10")

print(dir(testing_scenario))