import logging
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Cache variables
_IS_TRAINED = False
_ENSEMBLE_MODELS = None
_METRICS = None
_FEATURE_NAMES = [
    "depth_md", "formation_encoded", "mud_weight_ppg", "rop_m_hr",
    "wob_klbs", "rpm", "torque_kft_lbs", "spp_psi", 
    "nearby_event_count", "distance_to_nearest_well_km"
]
_TARGET_NAMES = {
    0: "normal",
    1: "stuck_pipe",
    2: "mud_loss",
    3: "kick",
    4: "tight_hole"
}
_REVERSE_TARGET_NAMES = {v: k for k, v in _TARGET_NAMES.items()}
_RISK_ACTIONS = {
    "normal": ["Continue drilling normally", "Maintain parameters"],
    "stuck_pipe": ["Pump lubricant pill", "Increase RPM", "Work pipe up and down", "Check mud rheology"],
    "mud_loss": ["Add LCM to mud system", "Reduce pump rate", "Monitor pit levels closely"],
    "kick": ["Shut in well", "Monitor casing pressure", "Prepare kill mud", "Circulate out kick"],
    "tight_hole": ["Perform wiper trip", "Increase mud weight slightly", "Monitor overpull on connections"]
}

def generate_training_data(n_samples=2500):
    np.random.seed(42)
    
    # 0: Alluvium, 1: Dhekiajuli, 2: Girujan, 3: Tipam, 4: Barail, 5: Basement
    formations = np.random.choice([0, 1, 2, 3, 4, 5], size=n_samples, p=[0.10, 0.10, 0.25, 0.25, 0.20, 0.10])
    
    depths = []
    for f in formations:
        if f == 0: depths.append(np.random.uniform(50, 300))
        elif f == 1: depths.append(np.random.uniform(300, 800))
        elif f == 2: depths.append(np.random.uniform(800, 2200)) # Girujan
        elif f == 3: depths.append(np.random.uniform(2200, 3000)) # Tipam
        elif f == 4: depths.append(np.random.uniform(3000, 3700)) # Barail
        else: depths.append(np.random.uniform(3700, 5000)) # Basement
    depths = np.array(depths)
    
    mud_weights = np.random.uniform(8.5, 12.5, size=n_samples)
    rops = np.random.uniform(2, 35, size=n_samples)
    wobs = np.random.uniform(10, 42, size=n_samples)
    rpms = np.random.uniform(35, 120, size=n_samples)
    torques = np.random.uniform(5, 25, size=n_samples)
    spps = np.random.uniform(1500, 4000, size=n_samples)
    nearby_events = np.random.poisson(lam=1, size=n_samples)
    distances = np.random.uniform(0.2, 5.0, size=n_samples)
    
    y = np.zeros(n_samples, dtype=int)
    
    for i in range(n_samples):
        f = formations[i]
        d = depths[i]
        mw = mud_weights[i]
        wob = wobs[i]
        rpm = rpms[i]
        
        # Upper Assam Geomechanics Rules:
        if f == 2 and (rpm < 65 or wob > 30):
            # Girujan Swelling Clay: low string rotation or excessive WOB causes differential sticking
            y[i] = 1 if np.random.rand() < 0.92 else 0
        elif f == 3 and mw < 9.8:
            # Tipam Sandstone: underbalanced mud weight causes severe lost circulation
            y[i] = 2 if np.random.rand() < 0.92 else 0
        elif f == 4 and mw < 10.7:
            # Barail Group: pore pressure exceeds mud hydrostatic, triggering gas kick
            y[i] = 3 if np.random.rand() < 0.94 else 0
        elif f == 5 and (wob > 32 or rpm > 100):
            # Hard basement rock: high vibration causes tight hole & bit bounce
            y[i] = 4 if np.random.rand() < 0.88 else 0
        else:
            y[i] = 0 # Normal stable drilling
        
    X = pd.DataFrame({
        "depth_md": depths,
        "formation_encoded": formations,
        "mud_weight_ppg": mud_weights,
        "rop_m_hr": rops,
        "wob_klbs": wobs,
        "rpm": rpms,
        "torque_kft_lbs": torques,
        "spp_psi": spps,
        "nearby_event_count": nearby_events,
        "distance_to_nearest_well_km": distances
    })
    
    return X, y

def train_models():
    global _IS_TRAINED, _ENSEMBLE_MODELS, _METRICS
    try:
        from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_auc_score
        from sklearn.preprocessing import label_binarize
    except ImportError:
        logger.error("scikit-learn not installed. Cannot train models.")
        return False
        
    logger.info("Generating training data...")
    X, y = generate_training_data(n_samples=2000)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    logger.info("Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    
    logger.info("Training Gradient Boosting...")
    gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
    gb.fit(X_train, y_train)
    
    _ENSEMBLE_MODELS = {"rf": rf, "gb": gb}
    
    # Eval
    rf_probs = rf.predict_proba(X_test)
    gb_probs = gb.predict_proba(X_test)
    ens_probs = (rf_probs + gb_probs) / 2
    y_pred = np.argmax(ens_probs, axis=1)
    
    acc = accuracy_score(y_test, y_pred)
    cr = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    classes = [0, 1, 2, 3, 4]
    y_test_bin = label_binarize(y_test, classes=classes)
    
    roc_auc = {}
    try:
        roc_auc_vals = roc_auc_score(y_test_bin, ens_probs, average=None, multi_class='ovr')
        for i, val in enumerate(roc_auc_vals):
            roc_auc[_TARGET_NAMES[classes[i]]] = float(val)
    except Exception as e:
        logger.warning(f"ROC AUC could not be computed: {e}")
        
    metrics = {
        "accuracy": acc,
        "classification_report": cr,
        "confusion_matrix": cm,
        "roc_auc_one_vs_rest": roc_auc,
        "training_samples": len(X_train),
        "test_samples": len(X_test)
    }
    
    _METRICS = metrics
    _IS_TRAINED = True
    
    # Feature importances
    importances = rf.feature_importances_
    _METRICS["feature_importance"] = {
        _FEATURE_NAMES[i]: float(importances[i]) for i in range(len(_FEATURE_NAMES))
    }
    
    logger.info(f"Training completed. Ensemble Accuracy: {acc:.4f}")
    return True

def predict_risk(depth_md, formation, mud_weight, rop, wob, rpm, torque, spp, nearby_events, distance_km):
    if not _IS_TRAINED:
        success = train_models()
        if not success:
            return {"error": "Models could not be trained."}
            
    X_new = pd.DataFrame([{
        "depth_md": depth_md,
        "formation_encoded": formation,
        "mud_weight_ppg": mud_weight,
        "rop_m_hr": rop,
        "wob_klbs": wob,
        "rpm": rpm,
        "torque_kft_lbs": torque,
        "spp_psi": spp,
        "nearby_event_count": nearby_events,
        "distance_to_nearest_well_km": distance_km
    }])
    
    rf = _ENSEMBLE_MODELS["rf"]
    gb = _ENSEMBLE_MODELS["gb"]
    
    rf_probs = rf.predict_proba(X_new)[0]
    gb_probs = gb.predict_proba(X_new)[0]
    
    ens_probs = (rf_probs + gb_probs) / 2
    
    pred_dict = {
        _TARGET_NAMES[i]: float(ens_probs[i]) for i in range(len(_TARGET_NAMES))
    }
    
    # Operational Safety Prioritization:
    # If any non-normal hazard is elevated (>= 0.25 probability), prioritize it as the active warning
    hazard_indices = [1, 2, 3, 4] # stuck_pipe, mud_loss, kick, tight_hole
    max_hazard_idx = max(hazard_indices, key=lambda idx: ens_probs[idx])
    
    if ens_probs[max_hazard_idx] >= 0.25:
        top_idx = max_hazard_idx
    else:
        top_idx = np.argmax(ens_probs)
        
    top_risk = _TARGET_NAMES[top_idx]
    confidence = float(ens_probs[top_idx])
    
    return {
        "predictions": pred_dict,
        "top_risk": top_risk,
        "confidence": confidence,
        "recommended_actions": _RISK_ACTIONS.get(top_risk, [])
    }

def get_model_metrics():
    if not _IS_TRAINED:
        train_models()
    return _METRICS

# Auto-train on import
try:
    if not _IS_TRAINED:
        train_models()
except Exception as e:
    logger.error(f"Auto-train failed: {e}")
