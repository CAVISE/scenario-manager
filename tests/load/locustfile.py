from locust import HttpUser, task, between


class ScenarioManagerUser(HttpUser):
    wait_time = between(1, 3)

    @task(10)
    def get_status(self):
        self.client.get("/api/status")

    @task(5)
    def get_health(self):
        self.client.get("/health")

    @task(5)
    def list_scenarios(self):
        self.client.get("/api/v1/scenarios")

    @task(2)
    def get_scenario(self):
        self.client.get("/api/v1/scenarios/test-scenario-id")

    @task(2)
    def list_results(self):
        self.client.get("/api/results/Town01_20250101_120000")

    @task(1)
    def create_scenario(self):
        self.client.post(
            "/api/v1/scenarios",
            json={
                "name_of_scenario": "Load Test Scenario",
                "scenario_id": f"load-test-{self.user_id}",
                "scenario": [],
            },
        )
