---
marp: true
theme: default
paginate: true
footer: 'AI-Driven Digital Health Monitoring | Athulya Arun'
---

<!-- _class: lead -->
# AI-Driven Digital Health Monitoring Systems for Rural Child and Maternal Care using Web Technologies

**Athulya Arun** · PG Scholar  
Department of Computer Applications  
Amal Jyothi College of Engineering, Autonomous, Kanjirappally, India  

**Guide:** Ms. Lisha Varghese, Assistant Professor  

athulyaarun2026@mca.ajce.in

---

## Contents

- Abstract  
- Literature Review  
- Introduction  
- Methodology  
- Implementation & Technology Stack  
- Benefits  
- Results  
- Conclusion  
- References  

---

## Abstract

- Rural Anganwadi and ASHA workers often rely on **paper registers** — warning signs (Hb drop, missed vaccines, poor weight gain) are noticed **late**.  
- This seminar presents a **web-based digital health system** for rural **maternal and child care**.  
- **Role-based dashboards** (Anganwadi, ASHA, Panchayat, parents) + **ML models** on growth charts, nutrition, pregnancy data.  
- Stack: **React.js, Node.js, MongoDB, Firebase Authentication** — centralised records and **early-risk alerts** (malnutrition, anaemia, high-risk pregnancy).  
- **Supports frontline workers** — clearer information, follow-up lists, visibility for administrators — **not** replacing them.  

---

## Literature Review

**I. Digital health for community workers** — Sharma et al. [2]: mobile/digital recording reduces manual errors and improves data reliability.  

**II. Maternal health platforms** — Patel & Kumar [6]: digital systems improve tracking of ANC visits, nutrition, pregnancy progress.  

**III. Malnutrition prediction** — Wang et al. [3]: ML on age, height, weight for early malnutrition detection.  

**IV. Maternal risk assessment** — Liu & Zhang [4]: ML on BP, Hb, BMI for high-risk pregnancy detection.  

**Gap:** Strong adoption of such platforms in **rural Anganwadi workflows** remains limited — opportunity for **AI-driven, web-based** monitoring tailored to communities.  

---

## Introduction

- **Anganwadi centres** are central to ICDS — supplements, vaccinations, nutrition, adolescent health — but **paper-based** processes hide trends and delay action.  
- **Problem:** Lost records, buried growth curves, late detection of malnutrition and pregnancy risk; adolescent health data often **invisible** to beneficiaries.  
- **Idea:** Digitise what workers **already collect** — growth entry, ANC, supplements, ASHA visits, sanitation logs — with a **lightweight AI layer** for early risk flags.  
- **Stakeholders:** Anganwadi workers, ASHA, Panchayat, parents, adolescents, sanitation staff — **one ecosystem**, role-based access.  

---

## Methodology (1/3)

**System design**  
- Role-based modules: Anganwadi, ASHA, Panchayat, parents, adolescents, sanitation.  
- Digitises familiar tasks: growth entry, supplement logs, **ANC tracking**, field visit updates.  

**Data collection**  
- Child: age, weight, height, MUAC/BMI where applicable.  
- Maternal: gestational age, Hb, BP, ANC schedule, supplement intake.  
- Immunisation delays, scheme delivery, ASHA notes, sanitation indicators.  

---

## Methodology (2/3)

**Preprocessing & quality**  
- Missing values, date standardisation, deduplication, normalisation; categorical encoding; **validation** flags for inconsistent entries.  

**Feature engineering**  
- Missed ANC count, vaccination delay index, supplement adherence ratio, previous adverse pregnancy history — **context-aware** risk scoring.  

**Models**  
- **Logistic Regression, Decision Tree, Random Forest** — risk classes (e.g. Low / Moderate / High) for malnutrition, anaemia, high-risk pregnancy.  

---

## Methodology (3/3)

**Evaluation**  
- Accuracy, precision, recall, F1, confusion matrix; emphasis on **not missing high-risk** cases.  

**Alert logic**  
- Colour-coded risk badges, **follow-up lists**, reminders (ANC / vaccines / supplements), **ward-level** summaries for administrators.  

*(Insert **Figure 1: System Architecture** and **Figure 2: Risk Prediction Flowchart** from your report.)*  

---

## Implementation & Technology Stack

| Layer | Technology |
|--------|------------|
| **Frontend** | React.js — responsive dashboards, role-based views |
| **Backend** | Node.js + Express.js — REST APIs, business logic |
| **Database** | MongoDB — health records, visits, schemes, alerts |
| **Auth** | Firebase Authentication — secure login, RBAC |
| **AI** | Python + **Scikit-learn** — API to backend; batch & on-demand scoring |
| **Deployment** | Local pilot → cloud scale; phased rollout |

---

## Benefits

- **Earlier risk identification** — clinical + contextual scoring.  
- **Continuity of care** — unified records across Anganwadi, ASHA, supervisors.  
- **Actionable dashboards** — follow-up lists, not raw tables only.  
- **Transparency** — scheme delivery traceable and auditable.  
- **Less manual burden** — summaries and alerts.  
- **Community-centred** — parents see milestones; trust and participation improve.  

---

## Results

**Application**  
- Prototype supports **secure RBAC**, structured maternal/child entry, **API calls** to the ML module — feasible for **Anganwadi–ASHA** workflow.  

**ML (synthetic demo data, n=1000, 80/20 split, stratified, scaled, balanced classes)**  

| Model | Accuracy | Precision (w) | Recall (w) | F1 (w) |
|--------|----------|-----------------|------------|--------|
| Logistic Regression | 0.70 | 0.711 | 0.70 | 0.699 |
| Decision Tree | 0.84 | 0.851 | 0.84 | 0.844 |
| **Random Forest** | **0.86** | **0.852** | **0.86** | **0.852** |

*Replace with real field data after pilot.*  

---

## Results — Discussion (short)

- Numbers reflect **synthetic** pipeline aligned with the project — **not** clinical certification.  
- **Random Forest** best overall; real deployment needs **local retraining** and **data quality** from the field.  
- Success = **usable alerts** + worker trust — not accuracy alone.  

*(Optional: add screenshots of pregnancy dashboard / ASHA visit / alerts.)*  

---

## Conclusion

- Built for the **Anganwadi worker** with paper registers — **tools that work as hard as she does**, not replacing her.  
- Starts from **routine visits** — growth, vaccines, ANC — made **visible** and **actionable**; adolescents, pregnancy, sanitation, ASHA in one vision.  
- **AI** flags malnutrition, high-risk pregnancy, nutrition trends — supports **human judgment**.  
- **Next:** pilot in the community — learn whether alerts **help** or overwhelm; privacy, consent, training.  
- With care, **digital tools can strengthen** rural public health — **without replacing** the people who deliver it.  

---

## References

1. WHO, *Maternal and Child Health Statistics*, 2022.  
2. R. Sharma & S. Kumar, *Digital Health Monitoring Systems for Rural Healthcare*, IJHT, 2021.  
3. H. Wang et al., *Machine Learning for Malnutrition Prediction*, IEEE Trans. Med. Informatics, 2020.  
4. Y. Liu & J. Zhang, *AI-Based Risk Prediction for Maternal Health*, J. Health Informatics, 2021.  
5. ICDS Programme Guidelines, MoWCD, GoI.  
6. Patel & Kumar, ImTeCHO, *Journal of Global Health*, 2019.  

---

<!-- _class: lead -->
# Thank You

**Questions?**

Athulya Arun · athulyaarun2026@mca.ajce.in  
