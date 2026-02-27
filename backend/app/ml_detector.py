# # Simple ML wrapper: threshold + IsolationForest on small sliding window
# from sklearn.ensemble import IsolationForest
# import numpy as np

# class SimpleDetector:
#     def __init__(self):
#         self.window = []
#         self.iforest = IsolationForest(contamination=0.02, random_state=42)
#         self.fitted = False

#     def update_and_score(self, reading):
#         # reading: dict with numeric values
#         vec = [reading['heart_rate'], reading['spo2'], reading['bp_sys'], reading['bp_dia'], reading['temperature']]
#         self.window.append(vec)
#         if len(self.window) > 200:
#             self.window.pop(0)
#         X = np.array(self.window)
#         if len(self.window) >= 30 and not self.fitted:
#             try:
#                 self.iforest.fit(X)
#                 self.fitted = True
#             except Exception:
#                 self.fitted = False
#         score = 0.0
#         if self.fitted:
#             try:
#                 s = self.iforest.score_samples([vec])[0]
#                 score = float(s)
#             except Exception:
#                 score = 0.0
#         return score

# # Threshold helper

# def threshold_check(r):
#     issues = []
#     if r['heart_rate'] < 40 or r['heart_rate'] > 140:
#         issues.append('Abnormal heart rate')
#     if r['spo2'] < 90:
#         issues.append('Low SpO2')
#     if r['bp_sys'] > 180 or r['bp_sys'] < 85 or r['bp_dia'] > 120 or r['bp_dia'] < 50:
#         issues.append('Abnormal blood pressure')
#     if r['temperature'] > 39.0 or r['temperature'] < 35.0:
#         issues.append('Abnormal temperature')
#     return issues
# Simple anomaly logic: threshold-only version
# (we removed scikit-learn to avoid heavy build tools issues)

class SimpleDetector:
    def __init__(self):
        # placeholder – no ML window for now
        pass

    def update_and_score(self, reading: dict) -> float:
        """
        In the original design this would maintain a sliding window and
        use IsolationForest. For this simplified version we just return 0.0
        and let threshold_check handle most anomalies.
        """
        return 0.0


def threshold_check(r):
    """
    Basic rule-based checks for vitals.
    r: dict with keys heart_rate, spo2, bp_sys, bp_dia, temperature
    """
    issues = []
    if r["heart_rate"] < 40 or r["heart_rate"] > 140:
        issues.append("Abnormal heart rate")
    if r["spo2"] < 90:
        issues.append("Low SpO2")
    if (
        r["bp_sys"] > 180
        or r["bp_sys"] < 85
        or r["bp_dia"] > 120
        or r["bp_dia"] < 50
    ):
        issues.append("Abnormal blood pressure")
    if r["temperature"] > 39.0 or r["temperature"] < 35.0:
        issues.append("Abnormal temperature")
    return issues
