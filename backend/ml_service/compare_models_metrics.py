"""One-off script: compare LR, DT, RF on same synthetic data as app.py initialize_model."""
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

np.random.seed(42)
n_samples = 1000
feature_columns = [
    "age", "gestationalWeek", "hb", "bp_systolic", "bp_diastolic",
    "weight", "bmi", "visitRegularity_regular", "visitRegularity_irregular",
    "visitRegularity_poor", "supplementCompliance", "symptoms_headache",
    "symptoms_dizziness", "symptoms_swelling", "symptoms_bleeding",
    "symptoms_pain", "symptoms_fever", "symptoms_nausea", "symptoms_vomiting",
    "symptoms_fatigue",
]

data = {
    "age": np.random.normal(25, 5, n_samples),
    "gestationalWeek": np.random.randint(1, 41, n_samples),
    "hb": np.random.normal(11.5, 1.5, n_samples),
    "bp_systolic": np.random.normal(120, 15, n_samples),
    "bp_diastolic": np.random.normal(80, 10, n_samples),
    "weight": np.random.normal(65, 10, n_samples),
    "bmi": np.random.normal(24, 4, n_samples),
    "supplementCompliance": np.random.uniform(0, 100, n_samples),
}
visit_regularity = np.random.choice(["regular", "irregular", "poor"], n_samples, p=[0.6, 0.3, 0.1])
data["visitRegularity_regular"] = (visit_regularity == "regular").astype(int)
data["visitRegularity_irregular"] = (visit_regularity == "irregular").astype(int)
data["visitRegularity_poor"] = (visit_regularity == "poor").astype(int)
symptoms_list = [
    "headache", "dizziness", "swelling", "bleeding", "pain",
    "fever", "nausea", "vomiting", "fatigue",
]
for symptom in symptoms_list:
    data["symptoms_" + symptom] = np.random.choice([0, 1], n_samples, p=[0.8, 0.2])

risk_labels = []
for i in range(n_samples):
    risk_score = 0
    if data["hb"][i] < 11:
        risk_score += 2
    if data["hb"][i] < 9:
        risk_score += 2
    if data["bp_systolic"][i] > 140 or data["bp_diastolic"][i] > 90:
        risk_score += 2
    if data["bp_systolic"][i] > 160 or data["bp_diastolic"][i] > 100:
        risk_score += 2
    if data["bmi"][i] < 18.5:
        risk_score += 1
    if data["bmi"][i] > 30:
        risk_score += 2
    if data["age"][i] > 35:
        risk_score += 1
    if visit_regularity[i] == "poor":
        risk_score += 2
    elif visit_regularity[i] == "irregular":
        risk_score += 1
    if data["symptoms_bleeding"][i] == 1:
        risk_score += 4
    if data["symptoms_swelling"][i] == 1:
        risk_score += 1
    if data["symptoms_fever"][i] == 1:
        risk_score += 1
    if risk_score >= 8:
        risk_labels.append("CRITICAL")
    elif risk_score >= 6:
        risk_labels.append("HIGH")
    elif risk_score >= 3:
        risk_labels.append("MEDIUM")
    else:
        risk_labels.append("LOW")

data["riskLabel"] = risk_labels
X = np.column_stack([data[c] for c in feature_columns])
y = np.array(risk_labels)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s = scaler.transform(X_test)

models = {
    "Logistic Regression": LogisticRegression(max_iter=2000, random_state=42, class_weight="balanced"),
    "Decision Tree": DecisionTreeClassifier(random_state=42, class_weight="balanced"),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced"),
}

print("Model | Accuracy | Precision (weighted) | Recall (weighted) | F1 (weighted)")
for name, clf in models.items():
    clf.fit(X_train_s, y_train)
    y_pred = clf.predict(X_test_s)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    print(f"{name} | {acc:.4f} | {prec:.4f} | {rec:.4f} | {f1:.4f}")
