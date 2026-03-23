"""
ML Risk Prediction Service for Pregnancy Monitoring
FastAPI service that predicts pregnancy risks using scikit-learn
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    precision_score,
    recall_score,
    f1_score,
)
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Pregnancy Risk Prediction API", version="1.0.0")

# Pydantic models for input/output
class HealthData(BaseModel):
    age: float
    gestationalWeek: int
    hb: float  # hemoglobin
    bp: dict  # {systolic: int, diastolic: int}
    weight: float
    bmi: float
    symptoms: List[str]
    visitRegularity: str  # 'regular', 'irregular', 'poor'
    supplementCompliance: int  # 0-100
    # Seminar paper: compare Logistic Regression, Decision Tree, Random Forest (default: RF)
    ml_model: Optional[str] = "random_forest"

class RiskPrediction(BaseModel):
    risk: str  # LOW, MEDIUM, HIGH, CRITICAL
    score: float  # 0-1
    factors: List[str]
    recommendations: List[str]
    ml_model_used: Optional[str] = None  # which sklearn model produced this prediction

class TrainingData(BaseModel):
    age: float
    gestationalWeek: int
    hb: float
    bp_systolic: int
    bp_diastolic: int
    weight: float
    bmi: float
    symptoms: List[str]
    visitRegularity: str
    supplementCompliance: int
    riskLabel: str  # LOW, MEDIUM, HIGH, CRITICAL

# Global: multiple sklearn models (seminar paper), shared scaler, test-set metrics
models_dict = {}
model_metrics = {}
DEFAULT_MODEL_KEY = "random_forest"
MODEL_ALIASES = {
    "rf": "random_forest",
    "randomforest": "random_forest",
    "lr": "logistic_regression",
    "logistic": "logistic_regression",
    "dt": "decision_tree",
    "tree": "decision_tree",
}
model = None  # legacy pointer -> same as RF after init
scaler = None
feature_columns = [
    'age', 'gestationalWeek', 'hb', 'bp_systolic', 'bp_diastolic',
    'weight', 'bmi', 'visitRegularity_regular', 'visitRegularity_irregular',
    'visitRegularity_poor', 'supplementCompliance', 'symptoms_headache',
    'symptoms_dizziness', 'symptoms_swelling', 'symptoms_bleeding',
    'symptoms_pain', 'symptoms_fever', 'symptoms_nausea', 'symptoms_vomiting',
    'symptoms_fatigue'
]

# Initialize model with default training data
def _resolve_model_key(name: Optional[str]) -> str:
    if not name:
        return DEFAULT_MODEL_KEY
    k = str(name).lower().strip().replace("-", "_")
    k = MODEL_ALIASES.get(k, k)
    if k in models_dict:
        return k
    return DEFAULT_MODEL_KEY


def initialize_model():
    global model, scaler, models_dict, model_metrics
    
    try:
        # Create synthetic training data for demonstration
        np.random.seed(42)
        n_samples = 1000
        
        # Generate realistic pregnancy data
        data = {
            'age': np.random.normal(25, 5, n_samples),
            'gestationalWeek': np.random.randint(1, 41, n_samples),
            'hb': np.random.normal(11.5, 1.5, n_samples),
            'bp_systolic': np.random.normal(120, 15, n_samples),
            'bp_diastolic': np.random.normal(80, 10, n_samples),
            'weight': np.random.normal(65, 10, n_samples),
            'bmi': np.random.normal(24, 4, n_samples),
            'supplementCompliance': np.random.uniform(0, 100, n_samples)
        }
        
        # Add categorical features
        visit_regularity = np.random.choice(['regular', 'irregular', 'poor'], n_samples, p=[0.6, 0.3, 0.1])
        data['visitRegularity_regular'] = (visit_regularity == 'regular').astype(int)
        data['visitRegularity_irregular'] = (visit_regularity == 'irregular').astype(int)
        data['visitRegularity_poor'] = (visit_regularity == 'poor').astype(int)
        
        # Add symptoms
        symptoms_list = ['headache', 'dizziness', 'swelling', 'bleeding', 'pain', 'fever', 'nausea', 'vomiting', 'fatigue']
        for symptom in symptoms_list:
            data[f'symptoms_{symptom}'] = np.random.choice([0, 1], n_samples, p=[0.8, 0.2])
        
        # Create risk labels based on medical guidelines
        risk_labels = []
        for i in range(n_samples):
            risk_score = 0
            
            # Anemia risk
            if data['hb'][i] < 11:
                risk_score += 2
            if data['hb'][i] < 9:
                risk_score += 2
            
            # Hypertension risk
            if data['bp_systolic'][i] > 140 or data['bp_diastolic'][i] > 90:
                risk_score += 2
            if data['bp_systolic'][i] > 160 or data['bp_diastolic'][i] > 100:
                    risk_score += 2
            
            # BMI risk
            if data['bmi'][i] < 18.5:
                risk_score += 1
            if data['bmi'][i] > 30:
                risk_score += 2
            
            # Age risk
            if data['age'][i] > 35:
                risk_score += 1
            
            # Visit regularity
            if visit_regularity[i] == 'poor':
                risk_score += 2
            elif visit_regularity[i] == 'irregular':
                risk_score += 1
            
            # Symptoms
            if data['symptoms_bleeding'][i] == 1:
                risk_score += 4
            if data['symptoms_swelling'][i] == 1:
                risk_score += 1
            if data['symptoms_fever'][i] == 1:
                    risk_score += 1
            
            # Determine risk level
            if risk_score >= 8:
                risk_labels.append('CRITICAL')
            elif risk_score >= 6:
                risk_labels.append('HIGH')
            elif risk_score >= 3:
                risk_labels.append('MEDIUM')
            else:
                risk_labels.append('LOW')
        
        data['riskLabel'] = risk_labels
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Prepare features
        X = df[feature_columns]
        y = df['riskLabel']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        classifiers = {
            "logistic_regression": LogisticRegression(
                max_iter=2000, random_state=42, class_weight="balanced"
            ),
            "decision_tree": DecisionTreeClassifier(
                random_state=42, class_weight="balanced"
            ),
            "random_forest": RandomForestClassifier(
                n_estimators=100, random_state=42, class_weight="balanced"
            ),
        }
        models_dict = {}
        model_metrics = {}
        for key, clf in classifiers.items():
            clf.fit(X_train_scaled, y_train)
            y_pred = clf.predict(X_test_scaled)
            models_dict[key] = clf
            model_metrics[key] = {
                "accuracy": float(accuracy_score(y_test, y_pred)),
                "precision_weighted": float(
                    precision_score(y_test, y_pred, average="weighted", zero_division=0)
                ),
                "recall_weighted": float(
                    recall_score(y_test, y_pred, average="weighted", zero_division=0)
                ),
                "f1_weighted": float(
                    f1_score(y_test, y_pred, average="weighted", zero_division=0)
                ),
            }
            logger.info(
                f"Model [{key}] accuracy: {model_metrics[key]['accuracy']:.4f} "
                f"F1(w): {model_metrics[key]['f1_weighted']:.4f}"
            )

        model = models_dict[DEFAULT_MODEL_KEY]
        logger.info(f"Training data distribution: {dict(pd.Series(y_train).value_counts())}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error initializing model: {str(e)}")
        return False

def preprocess_input(data: HealthData):
    """Convert input data to model format"""
    input_dict = {
        'age': data.age,
        'gestationalWeek': data.gestationalWeek,
        'hb': data.hb,
        'bp_systolic': data.bp.get('systolic', 120),
        'bp_diastolic': data.bp.get('diastolic', 80),
        'weight': data.weight,
        'bmi': data.bmi,
        'supplementCompliance': data.supplementCompliance,
        'visitRegularity_regular': 1 if data.visitRegularity == 'regular' else 0,
        'visitRegularity_irregular': 1 if data.visitRegularity == 'irregular' else 0,
        'visitRegularity_poor': 1 if data.visitRegularity == 'poor' else 0,
    }
    
    # Add symptoms
    all_symptoms = ['headache', 'dizziness', 'swelling', 'bleeding', 'pain', 'fever', 'nausea', 'vomiting', 'fatigue']
    for symptom in all_symptoms:
        input_dict[f'symptoms_{symptom}'] = 1 if symptom in data.symptoms else 0
    
    # Create DataFrame with correct column order
    df = pd.DataFrame([input_dict])
    return df[feature_columns]

def get_risk_factors(data: HealthData, prediction: str, score: float):
    """Identify key risk factors based on input data and prediction"""
    factors = []
    
    # Check anemia
    if data.hb < 11:
        factors.append(f"Low hemoglobin ({data.hb} g/dL)")
    if data.hb < 9:
        factors.append("Severe anemia")
    
    # Check hypertension
    systolic = data.bp.get('systolic', 120)
    diastolic = data.bp.get('diastolic', 80)
    if systolic > 140 or diastolic > 90:
        factors.append(f"High blood pressure ({systolic}/{diastolic} mmHg)")
    if systolic > 160 or diastolic > 100:
        factors.append("Severe hypertension")
    
    # Check BMI
    if data.bmi < 18.5:
        factors.append(f"Underweight (BMI: {data.bmi})")
    if data.bmi > 30:
        factors.append(f"Obesity (BMI: {data.bmi})")
    
    # Check age
    if data.age > 35:
        factors.append(f"Advanced maternal age ({data.age} years)")
    
    # Check visit regularity
    if data.visitRegularity == 'poor':
        factors.append("Poor visit regularity")
    elif data.visitRegularity == 'irregular':
        factors.append("Irregular visit pattern")
    
    # Check supplement compliance
    if data.supplementCompliance < 50:
        factors.append(f"Low supplement compliance ({data.supplementCompliance}%)")
    
    # Check symptoms
    if 'bleeding' in data.symptoms:
        factors.append("Bleeding symptoms")
    if 'swelling' in data.symptoms:
        factors.append("Swelling/edema")
    if 'fever' in data.symptoms:
        factors.append("Fever")
    
    return factors

def get_recommendations(prediction: str, factors: List[str]):
    """Generate recommendations based on risk level and factors"""
    recommendations = []
    
    if prediction == 'CRITICAL':
        recommendations.extend([
            "Immediate medical consultation required",
            "Emergency hospital admission if severe symptoms",
            "Continuous monitoring needed",
            "Consider specialist referral"
        ])
    elif prediction == 'HIGH':
        recommendations.extend([
            "Urgent medical consultation within 24-48 hours",
            "Increase frequency of checkups",
            "Strict adherence to medication and supplements",
            "Lifestyle modifications required"
        ])
    elif prediction == 'MEDIUM':
        recommendations.extend([
            "Regular medical follow-up within 1 week",
            "Improve supplement compliance",
            "Monitor vital signs regularly",
            "Nutritional counseling recommended"
        ])
    else:  # LOW
        recommendations.extend([
            "Continue routine prenatal care",
            "Maintain healthy lifestyle",
            "Regular exercise as approved",
            "Stay hydrated and eat balanced diet"
        ])
    
    # Add specific recommendations based on factors
    factor_text = ' '.join(factors).lower()
    
    if 'anemia' in factor_text:
        recommendations.append("Increase iron-rich foods and iron supplements")
    if 'hypertension' in factor_text:
        recommendations.append("Low-sodium diet and blood pressure monitoring")
    if 'obesity' in factor_text:
        recommendations.append("Weight management program under medical supervision")
    if 'underweight' in factor_text:
        recommendations.append("Nutritional supplementation and weight gain plan")
    if 'compliance' in factor_text:
        recommendations.append("Set up reminder system for medications and supplements")
    
    return recommendations

@app.on_event("startup")
async def startup_event():
    """Initialize the ML model on startup"""
    success = initialize_model()
    if not success:
        logger.error("Failed to initialize ML model")
        raise HTTPException(status_code=500, detail="Failed to initialize ML model")

@app.get("/")
async def root():
    return {"message": "Pregnancy Risk Prediction API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": list(models_dict.keys()) if models_dict else [],
        "default_model": DEFAULT_MODEL_KEY,
    }

class BatchPredictRequest(BaseModel):
    """Batch scoring (seminar paper: periodic reports + real-time lists)."""
    items: List[HealthData]
    ml_model: Optional[str] = "random_forest"


@app.post("/predict-risk", response_model=RiskPrediction)
async def predict_risk(data: HealthData):
    """Predict pregnancy risk based on health data (model from data.model)."""
    try:
        if not models_dict or scaler is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        mk = _resolve_model_key(data.ml_model)
        clf = models_dict[mk]
        
        # Preprocess input (model field not passed to feature matrix)
        input_data = preprocess_input(data)
        
        # Scale features
        input_scaled = scaler.transform(input_data)
        
        # Make prediction
        prediction = clf.predict(input_scaled)[0]
        probabilities = clf.predict_proba(input_scaled)[0]
        
        # Get class probabilities
        max_prob_idx = np.argmax(probabilities)
        confidence = float(probabilities[max_prob_idx])
        
        # Get risk factors and recommendations
        risk_factors = get_risk_factors(data, prediction, confidence)
        recommendations = get_recommendations(prediction, risk_factors)
        
        return RiskPrediction(
            risk=prediction,
            score=confidence,
            factors=risk_factors,
            recommendations=recommendations,
            ml_model_used=mk,
        )
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict-batch")
async def predict_batch(req: BatchPredictRequest):
    """Score multiple records with one model (batch reports / ward lists)."""
    if not models_dict or scaler is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    mk = _resolve_model_key(req.ml_model)
    clf = models_dict[mk]
    results = []
    for item in req.items:
        row = item.model_dump()
        row["ml_model"] = mk
        data = HealthData(**row)
        input_data = preprocess_input(data)
        input_scaled = scaler.transform(input_data)
        prediction = clf.predict(input_scaled)[0]
        probabilities = clf.predict_proba(input_scaled)[0]
        confidence = float(np.max(probabilities))
        risk_factors = get_risk_factors(data, prediction, confidence)
        recommendations = get_recommendations(prediction, risk_factors)
        results.append(
            {
                "risk": prediction,
                "score": confidence,
                "factors": risk_factors,
                "recommendations": recommendations,
                "ml_model_used": mk,
            }
        )
    return {"count": len(results), "ml_model": mk, "predictions": results}


@app.get("/models/metrics")
async def get_models_metrics():
    """Seminar paper: comparison table (accuracy, precision, recall, F1 weighted)."""
    return {
        "default_model": DEFAULT_MODEL_KEY,
        "metrics": model_metrics,
        "note": "Synthetic n=1000 demo data; train/test 80/20 stratified, seed 42",
    }


@app.post("/train-model")
async def train_model(training_data: List[TrainingData]):
    """Retrain the model with new data"""
    try:
        if len(training_data) < 50:
            raise HTTPException(status_code=400, detail="Need at least 50 training samples")
        
        # Convert training data to DataFrame
        data_list = []
        for item in training_data:
            data_dict = {
                'age': item.age,
                'gestationalWeek': item.gestationalWeek,
                'hb': item.hb,
                'bp_systolic': item.bp_systolic,
                'bp_diastolic': item.bp_diastolic,
                'weight': item.weight,
                'bmi': item.bmi,
                'supplementCompliance': item.supplementCompliance,
                'visitRegularity_regular': 1 if item.visitRegularity == 'regular' else 0,
                'visitRegularity_irregular': 1 if item.visitRegularity == 'irregular' else 0,
                'visitRegularity_poor': 1 if item.visitRegularity == 'poor' else 0,
                'riskLabel': item.riskLabel
            }
            
            # Add symptoms
            all_symptoms = ['headache', 'dizziness', 'swelling', 'bleeding', 'pain', 'fever', 'nausea', 'vomiting', 'fatigue']
            for symptom in all_symptoms:
                data_dict[f'symptoms_{symptom}'] = 1 if symptom in item.symptoms else 0
            
            data_list.append(data_dict)
        
        df = pd.DataFrame(data_list)
        
        # Prepare features
        X = df[feature_columns]
        y = df['riskLabel']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        
        # Scale features
        global scaler, model, models_dict, model_metrics
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        classifiers = {
            "logistic_regression": LogisticRegression(
                max_iter=2000, random_state=42, class_weight="balanced"
            ),
            "decision_tree": DecisionTreeClassifier(
                random_state=42, class_weight="balanced"
            ),
            "random_forest": RandomForestClassifier(
                n_estimators=100, random_state=42, class_weight="balanced"
            ),
        }
        models_dict = {}
        model_metrics = {}
        for key, clf in classifiers.items():
            clf.fit(X_train_scaled, y_train)
            y_pred = clf.predict(X_test_scaled)
            models_dict[key] = clf
            model_metrics[key] = {
                "accuracy": float(accuracy_score(y_test, y_pred)),
                "precision_weighted": float(
                    precision_score(y_test, y_pred, average="weighted", zero_division=0)
                ),
                "recall_weighted": float(
                    recall_score(y_test, y_pred, average="weighted", zero_division=0)
                ),
                "f1_weighted": float(
                    f1_score(y_test, y_pred, average="weighted", zero_division=0)
                ),
            }
        model = models_dict[DEFAULT_MODEL_KEY]
        y_pred_rf = models_dict["random_forest"].predict(X_test_scaled)
        report = classification_report(y_test, y_pred_rf, output_dict=True)
        
        return {
            "message": "All models retrained successfully",
            "metrics": model_metrics,
            "classification_report_random_forest": report,
            "training_samples": len(training_data)
        }
        
    except Exception as e:
        logger.error(f"Error in model training: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    """Feature info + RF importances + metrics for all trained models."""
    try:
        if not models_dict or model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        rf = models_dict.get("random_forest")
        return {
            "models_available": list(models_dict.keys()),
            "default_model": DEFAULT_MODEL_KEY,
            "metrics": model_metrics,
            "random_forest": {
                "model_type": "RandomForestClassifier",
                "n_estimators": rf.n_estimators,
                "features": feature_columns,
                "classes": rf.classes_.tolist(),
                "feature_importance": dict(
                    zip(feature_columns, rf.feature_importances_.tolist())
                ),
            },
        }
        
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
