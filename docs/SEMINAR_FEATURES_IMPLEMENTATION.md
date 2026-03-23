# Seminar paper features — implementation map

Your **Seminar paper final 5** describes a role-based rural maternal & child health platform with **React, Node, MongoDB, Firebase**, and **Scikit-learn** (Logistic Regression, Decision Tree, Random Forest), plus alerts, follow-up lists, and ward-level visibility.

## Already in the project (before this pass)

- Role-based dashboards: **Super Admin (Panchayat-style)**, **Anganwadi worker**, **ASHA**, **Parent**, **Adolescent**, **Pregnant woman**, **Sanitation** — see `forntend/src/App.jsx`.
- **Firebase** + JWT flexible auth — `backend/middleware/auth.js`, `forntend/src/config/firebase.js`.
- **MongoDB** models for pregnancy, visits, alerts, etc.
- **Pregnancy ML** FastAPI service — `backend/ml_service/app.py`.

## Implemented to align with the paper

### 1. Three ML models (seminar methodology)

- On startup, the ML service trains **Logistic Regression**, **Decision Tree**, and **Random Forest** on the same synthetic demo pipeline.
- **Default prediction** uses **Random Forest** (best metrics on demo data).
- Request body field: `ml_model`: `random_forest` | `logistic_regression` | `decision_tree` (aliases: `lr`, `rf`, `dt`).

**Endpoints (port 8000):**

| Endpoint | Purpose |
|----------|---------|
| `POST /predict-risk` | Single prediction; optional `ml_model` |
| `POST /predict-batch` | Batch scoring for many rows |
| `GET /models/metrics` | Accuracy / precision / recall / F1 (weighted) for all three |
| `GET /model-info` | Metrics + RF feature importances |
| `GET /health` | Lists loaded models |

### 2. Node API bridge

- `GET /api/pregnancy/ml-metrics` — proxies to ML service (for admin UI & demos).
- `POST /api/pregnancy/predict` — accepts `modelType` or `ml_model` and forwards to Python.

### 3. Follow-up list & ward summary (paper: “actionable outputs”)

- `GET /api/pregnancy/follow-up/high-risk` — active `high_risk_pregnancy` alerts with beneficiary info (auth required).
- `GET /api/pregnancy/ward-summary` — counts by **anganwadiCenter** + active high-risk alerts per centre (auth required).

### 4. Admin UI

- **Health Monitoring** (`HealthMonitoringSimple`) includes a **“Seminar: ML models & follow-up”** block: metrics table, follow-up list, ward summary.

## How to run the ML service

```bash
cd backend/ml_service
pip install -r requirements.txt
py -3 -m uvicorn app:app --host 0.0.0.0 --port 8000
```

## Not fully automated (optional future work)

- **Child malnutrition** and **adolescent anemia** as separate trained models (paper mentions them; pregnancy RF pipeline covers one vertical).
- **Optional contextual fields** (missed ANC count, vaccine delay index, etc.) as extra model features — would require schema + retraining pipeline extension.
