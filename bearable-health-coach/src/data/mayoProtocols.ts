import { MayoProtocol, ProtocolStep, MonitoringCriterion } from '../types';

// Mayo Clinic Evidence-Based Protocols Database
export const MAYO_PROTOCOLS: MayoProtocol[] = [
  // === DIABETES PROTOCOLS ===
  {
    id: 'mayo-diabetes-t1-comprehensive',
    title: 'Type 1 Diabetes Comprehensive Management Protocol',
    category: 'diabetes',
    description: 'Evidence-based protocol for comprehensive Type 1 diabetes management including insulin therapy, glucose monitoring, and lifestyle optimization based on Mayo Clinic clinical guidelines.',
    clinicalGuidelines: [
      'ADA Standards of Medical Care in Diabetes 2024',
      'Mayo Clinic Type 1 Diabetes Management Guidelines',
      'Endocrine Society Clinical Practice Guidelines'
    ],
    evidenceLevel: 'A',
    lastReviewed: new Date('2024-12-01'),
    applicableConditions: [
      'Type 1 Diabetes Mellitus',
      'LADA (Latent Autoimmune Diabetes in Adults)',
      'Insulin-dependent diabetes'
    ],
    contraindicationsnd: [
      'Severe hypoglycemia unawareness without CGM',
      'Active diabetic ketoacidosis',
      'Severe renal failure (eGFR <15)'
    ],
    implementationSteps: [
      {
        id: 'insulin-optimization',
        title: 'Insulin Regimen Optimization',
        description: 'Establish optimal basal-bolus insulin therapy with carbohydrate counting',
        pillar: 'optimal_nutrition',
        timeframe: '2-4 weeks',
        priority: 'critical',
        prerequisites: ['Diabetes education completion', 'Carbohydrate counting competency'],
        expectedOutcomes: ['HbA1c improvement', 'Reduced glucose variability', 'Decreased hypoglycemia'],
        patientInstructions: 'Work with your healthcare team to adjust insulin doses based on blood glucose patterns and carbohydrate intake',
        providerNotes: 'Monitor for hypoglycemia patterns and adjust basal rates accordingly'
      },
      {
        id: 'cgm-integration',
        title: 'Continuous Glucose Monitoring Integration',
        description: 'Implement CGM technology for real-time glucose management and trend analysis',
        pillar: 'optimal_nutrition',
        timeframe: '1-2 weeks',
        priority: 'important',
        prerequisites: ['Insurance approval', 'Device training'],
        expectedOutcomes: ['Improved time-in-range', 'Reduced hypoglycemia fear', 'Better glucose awareness'],
        patientInstructions: 'Use CGM data to make informed decisions about insulin dosing and lifestyle choices',
        providerNotes: 'Review CGM data weekly for first month, then monthly'
      },
      {
        id: 'exercise-management',
        title: 'Exercise and Activity Management',
        description: 'Develop strategies for managing blood glucose during physical activity',
        pillar: 'physical_activity',
        timeframe: '4-6 weeks',
        priority: 'important',
        prerequisites: ['Stable glucose control', 'CGM or frequent monitoring'],
        expectedOutcomes: ['Safe exercise participation', 'Improved fitness', 'Better glucose control'],
        patientInstructions: 'Monitor glucose before, during, and after exercise. Adjust carbohydrates and insulin as needed',
        providerNotes: 'Provide exercise-specific glucose management guidelines'
      }
    ],
    monitoringCriteria: [
      {
        id: 'hba1c-target',
        metric: 'HbA1c',
        target: { value: 7.0, unit: '%', operator: '<' },
        frequency: 'quarterly',
        alertThresholds: { warning: 7.5, critical: 9.0 },
        dataSource: 'clinical'
      },
      {
        id: 'time-in-range',
        metric: 'Time in Range (70-180 mg/dL)',
        target: { value: 70, unit: '%', operator: '>' },
        frequency: 'weekly',
        alertThresholds: { warning: 60, critical: 50 },
        dataSource: 'wearable'
      },
      {
        id: 'severe-hypoglycemia',
        metric: 'Severe Hypoglycemia Events',
        target: { value: 0, unit: 'events/month', operator: '=' },
        frequency: 'monthly',
        alertThresholds: { warning: 1, critical: 2 },
        dataSource: 'patient_reported'
      }
    ],
    outcomeMetrics: [
      'HbA1c reduction',
      'Time-in-range improvement',
      'Hypoglycemia reduction',
      'Quality of life scores',
      'Treatment satisfaction'
    ],
    isActive: true
  },

  {
    id: 'mayo-diabetes-t2-lifestyle',
    title: 'Type 2 Diabetes Lifestyle Medicine Protocol',
    category: 'diabetes',
    description: 'Comprehensive lifestyle medicine approach for Type 2 diabetes management and potential remission based on Mayo Clinic Lifestyle Medicine principles.',
    clinicalGuidelines: [
      'Mayo Clinic Lifestyle Medicine Guidelines',
      'ADA Lifestyle Management Standards',
      'Diabetes Prevention Program Protocol'
    ],
    evidenceLevel: 'A',
    lastReviewed: new Date('2024-12-01'),
    applicableConditions: [
      'Type 2 Diabetes Mellitus',
      'Prediabetes',
      'Metabolic Syndrome',
      'Insulin Resistance'
    ],
    contraindicationsnd: [
      'Type 1 diabetes',
      'Secondary diabetes',
      'Active eating disorder',
      'Severe kidney disease'
    ],
    implementationSteps: [
      {
        id: 'nutrition-intervention',
        title: 'Medical Nutrition Therapy',
        description: 'Implement evidence-based nutrition intervention for glucose control',
        pillar: 'optimal_nutrition',
        timeframe: '12 weeks',
        priority: 'critical',
        prerequisites: ['Nutritionist consultation', 'Baseline metabolic panel'],
        expectedOutcomes: ['Weight loss', 'Improved glycemic control', 'Reduced medication needs'],
        patientInstructions: 'Follow plate method: 1/2 non-starchy vegetables, 1/4 lean protein, 1/4 complex carbohydrates',
        providerNotes: 'Monitor for hypoglycemia if patient is on glucose-lowering medications'
      },
      {
        id: 'structured-exercise',
        title: 'Structured Exercise Program',
        description: 'Progressive resistance and aerobic exercise program for diabetes management',
        pillar: 'physical_activity',
        timeframe: '16 weeks',
        priority: 'critical',
        prerequisites: ['Medical clearance', 'Baseline fitness assessment'],
        expectedOutcomes: ['Improved insulin sensitivity', 'Weight loss', 'Cardiovascular fitness'],
        patientInstructions: 'Aim for 150 minutes moderate aerobic activity plus 2 resistance sessions per week',
        providerNotes: 'Start conservatively and progress gradually, especially if sedentary'
      },
      {
        id: 'stress-management',
        title: 'Stress Reduction and Sleep Optimization',
        description: 'Address stress and sleep factors that impact glucose control',
        pillar: 'stress_management',
        timeframe: '8 weeks',
        priority: 'beneficial',
        prerequisites: ['Stress assessment', 'Sleep study if indicated'],
        expectedOutcomes: ['Improved stress levels', 'Better sleep quality', 'Enhanced glucose control'],
        patientInstructions: 'Practice daily stress reduction techniques and maintain consistent sleep schedule',
        providerNotes: 'Consider referral for sleep disorders or mental health support as needed'
      }
    ],
    monitoringCriteria: [
      {
        id: 'hba1c-improvement',
        metric: 'HbA1c',
        target: { value: 6.5, unit: '%', operator: '<' },
        frequency: 'quarterly',
        alertThresholds: { warning: 7.0, critical: 8.0 },
        dataSource: 'clinical'
      },
      {
        id: 'weight-loss',
        metric: 'Body Weight',
        target: { value: 5, unit: '% reduction', operator: '>' },
        frequency: 'monthly',
        alertThresholds: { warning: 2, critical: 0 },
        dataSource: 'patient_reported'
      },
      {
        id: 'medication-reduction',
        metric: 'Diabetes Medications',
        target: { value: 0, unit: 'reduction possible', operator: '>' },
        frequency: 'quarterly',
        alertThresholds: { warning: 0, critical: 0 },
        dataSource: 'clinical'
      }
    ],
    outcomeMetrics: [
      'HbA1c reduction',
      'Weight loss percentage',
      'Medication reduction',
      'Blood pressure improvement',
      'Lipid profile improvement'
    ],
    isActive: true
  },

  // === CARDIOVASCULAR PROTOCOLS ===
  {
    id: 'mayo-cardiac-rehabilitation',
    title: 'Cardiac Rehabilitation Phase II Protocol',
    category: 'cardiovascular',
    description: 'Comprehensive cardiac rehabilitation protocol for post-cardiac event recovery based on Mayo Clinic Cardiovascular Rehabilitation Program.',
    clinicalGuidelines: [
      'AHA/ACC Clinical Performance and Quality Measures for Cardiac Rehabilitation',
      'Mayo Clinic Cardiac Rehabilitation Guidelines',
      'European Society of Cardiology Prevention Guidelines'
    ],
    evidenceLevel: 'A',
    lastReviewed: new Date('2024-12-01'),
    applicableConditions: [
      'Myocardial Infarction',
      'Coronary Artery Bypass Surgery',
      'Percutaneous Coronary Intervention',
      'Heart Failure with Reduced Ejection Fraction',
      'Heart Valve Surgery'
    ],
    contraindicationsnd: [
      'Unstable angina',
      'Uncontrolled arrhythmias',
      'Severe aortic stenosis',
      'Acute myocarditis',
      'Severe pulmonary hypertension'
    ],
    implementationSteps: [
      {
        id: 'exercise-prescription',
        title: 'Individualized Exercise Prescription',
        description: 'Develop personalized exercise program based on stress test results and functional capacity',
        pillar: 'physical_activity',
        timeframe: '12 weeks',
        priority: 'critical',
        prerequisites: ['Cardiac stress test', 'Medical clearance', 'Risk stratification'],
        expectedOutcomes: ['Improved exercise capacity', 'Reduced cardiac risk', 'Enhanced quality of life'],
        patientInstructions: 'Attend supervised exercise sessions 2-3 times per week, monitor heart rate and symptoms',
        providerNotes: 'Monitor for exercise intolerance, arrhythmias, or ischemic symptoms'
      },
      {
        id: 'risk-factor-modification',
        title: 'Cardiovascular Risk Factor Modification',
        description: 'Address modifiable risk factors including hypertension, dyslipidemia, and diabetes',
        pillar: 'optimal_nutrition',
        timeframe: '12 weeks',
        priority: 'critical',
        prerequisites: ['Baseline lab work', 'Blood pressure monitoring'],
        expectedOutcomes: ['Optimal blood pressure', 'Target lipid levels', 'Glycemic control'],
        patientInstructions: 'Follow heart-healthy diet, take medications as prescribed, monitor vital signs',
        providerNotes: 'Adjust medications to achieve guideline-directed targets'
      },
      {
        id: 'psychological-support',
        title: 'Psychosocial Assessment and Support',
        description: 'Address anxiety, depression, and psychosocial factors affecting recovery',
        pillar: 'stress_management',
        timeframe: '12 weeks',
        priority: 'important',
        prerequisites: ['Psychological screening', 'Depression assessment'],
        expectedOutcomes: ['Reduced anxiety', 'Improved mood', 'Better treatment adherence'],
        patientInstructions: 'Participate in support groups, practice stress reduction techniques',
        providerNotes: 'Screen for depression and anxiety at each visit, refer for counseling if needed'
      }
    ],
    monitoringCriteria: [
      {
        id: 'exercise-capacity',
        metric: 'Peak VO2',
        target: { value: 20, unit: 'ml/kg/min', operator: '>' },
        frequency: 'quarterly',
        alertThresholds: { warning: 15, critical: 10 },
        dataSource: 'clinical'
      },
      {
        id: 'blood-pressure',
        metric: 'Blood Pressure',
        target: { value: 130, unit: 'mmHg systolic', operator: '<' },
        frequency: 'weekly',
        alertThresholds: { warning: 140, critical: 160 },
        dataSource: 'patient_reported'
      },
      {
        id: 'ldl-cholesterol',
        metric: 'LDL Cholesterol',
        target: { value: 70, unit: 'mg/dL', operator: '<' },
        frequency: 'quarterly',
        alertThresholds: { warning: 100, critical: 130 },
        dataSource: 'clinical'
      }
    ],
    outcomeMetrics: [
      'Exercise capacity improvement',
      'Blood pressure control',
      'Lipid management',
      'Medication adherence',
      'Return to work rates'
    ],
    isActive: true
  },

  // === MENTAL HEALTH PROTOCOLS ===
  {
    id: 'mayo-depression-lifestyle',
    title: 'Depression Lifestyle Medicine Integration Protocol',
    category: 'mental_health',
    description: 'Evidence-based lifestyle medicine approach for depression treatment integrating exercise, nutrition, and behavioral interventions.',
    clinicalGuidelines: [
      'Mayo Clinic Depression Treatment Guidelines',
      'APA Practice Guidelines for Major Depressive Disorder',
      'Lifestyle Medicine for Depression Evidence Review'
    ],
    evidenceLevel: 'B',
    lastReviewed: new Date('2024-12-01'),
    applicableConditions: [
      'Major Depressive Disorder',
      'Persistent Depressive Disorder',
      'Seasonal Affective Disorder',
      'Depression with Anxiety'
    ],
    contraindicationsnd: [
      'Active suicidal ideation',
      'Severe depression with psychotic features',
      'Bipolar disorder in manic phase',
      'Active substance abuse'
    ],
    implementationSteps: [
      {
        id: 'behavioral-activation',
        title: 'Behavioral Activation Program',
        description: 'Structured program to increase pleasant and meaningful activities',
        pillar: 'connectedness',
        timeframe: '8 weeks',
        priority: 'critical',
        prerequisites: ['Depression severity assessment', 'Safety planning'],
        expectedOutcomes: ['Increased activity levels', 'Improved mood', 'Enhanced motivation'],
        patientInstructions: 'Schedule and engage in 3-5 pleasant activities daily, track mood and activity levels',
        providerNotes: 'Monitor for treatment response and adjust activity goals as needed'
      },
      {
        id: 'exercise-prescription-depression',
        title: 'Exercise as Medicine for Depression',
        description: 'Structured exercise program with mood-enhancing focus',
        pillar: 'physical_activity',
        timeframe: '12 weeks',
        priority: 'critical',
        prerequisites: ['Medical clearance', 'Baseline fitness assessment'],
        expectedOutcomes: ['Reduced depressive symptoms', 'Improved energy', 'Better sleep'],
        patientInstructions: 'Aim for 30 minutes moderate exercise 5 days per week, start with 10-minute sessions',
        providerNotes: 'Exercise has equivalent efficacy to medication for mild-moderate depression'
      },
      {
        id: 'nutrition-mood',
        title: 'Nutrition for Mental Health',
        description: 'Implement anti-inflammatory diet patterns to support mood regulation',
        pillar: 'optimal_nutrition',
        timeframe: '8 weeks',
        priority: 'beneficial',
        prerequisites: ['Nutritional assessment', 'Dietary history'],
        expectedOutcomes: ['Stable mood', 'Improved energy', 'Better cognitive function'],
        patientInstructions: 'Follow Mediterranean-style diet rich in omega-3 fatty acids and antioxidants',
        providerNotes: 'Consider omega-3 supplementation if dietary intake is insufficient'
      }
    ],
    monitoringCriteria: [
      {
        id: 'phq9-score',
        metric: 'PHQ-9 Depression Score',
        target: { value: 9, unit: 'points', operator: '<' },
        frequency: 'weekly',
        alertThresholds: { warning: 15, critical: 20 },
        dataSource: 'patient_reported'
      },
      {
        id: 'activity-level',
        metric: 'Weekly Activity Minutes',
        target: { value: 150, unit: 'minutes', operator: '>' },
        frequency: 'weekly',
        alertThresholds: { warning: 75, critical: 30 },
        dataSource: 'wearable'
      },
      {
        id: 'sleep-quality',
        metric: 'Sleep Quality Score',
        target: { value: 7, unit: 'out of 10', operator: '>' },
        frequency: 'weekly',
        alertThresholds: { warning: 5, critical: 3 },
        dataSource: 'patient_reported'
      }
    ],
    outcomeMetrics: [
      'Depression severity reduction',
      'Quality of life improvement',
      'Treatment adherence',
      'Functional improvement',
      'Relapse prevention'
    ],
    isActive: true
  },

  // === CHRONIC PAIN PROTOCOLS ===
  {
    id: 'mayo-chronic-pain-management',
    title: 'Chronic Pain Comprehensive Management Protocol',
    category: 'chronic_pain',
    description: 'Multidisciplinary approach to chronic pain management based on Mayo Clinic Pain Rehabilitation Center protocols.',
    clinicalGuidelines: [
      'Mayo Clinic Pain Rehabilitation Program',
      'CDC Guidelines for Prescribing Opioids for Chronic Pain',
      'International Association for the Study of Pain Guidelines'
    ],
    evidenceLevel: 'A',
    lastReviewed: new Date('2024-12-01'),
    applicableConditions: [
      'Chronic Low Back Pain',
      'Fibromyalgia',
      'Chronic Fatigue Syndrome',
      'Chronic Regional Pain Syndrome',
      'Chronic Neck Pain'
    ],
    contraindicationsnd: [
      'Acute pain requiring immediate intervention',
      'Active malignancy causing pain',
      'Severe mental illness preventing participation',
      'Active substance use disorder'
    ],
    implementationSteps: [
      {
        id: 'pain-education',
        title: 'Pain Neuroscience Education',
        description: 'Comprehensive education about pain mechanisms and neuroplasticity',
        pillar: 'stress_management',
        timeframe: '4 weeks',
        priority: 'critical',
        prerequisites: ['Pain assessment', 'Cognitive screening'],
        expectedOutcomes: ['Improved pain understanding', 'Reduced fear avoidance', 'Better self-efficacy'],
        patientInstructions: 'Learn about pain science, practice mindfulness and relaxation techniques',
        providerNotes: 'Emphasize that pain does not equal tissue damage in chronic conditions'
      },
      {
        id: 'graded-activity',
        title: 'Graded Activity and Movement Therapy',
        description: 'Progressive increase in activity despite pain, focusing on function over pain reduction',
        pillar: 'physical_activity',
        timeframe: '12 weeks',
        priority: 'critical',
        prerequisites: ['Baseline functional assessment', 'Movement screen'],
        expectedOutcomes: ['Improved function', 'Increased activity tolerance', 'Better quality of life'],
        patientInstructions: 'Gradually increase activity levels regardless of pain fluctuations',
        providerNotes: 'Focus on function and activity goals rather than pain reduction goals'
      },
      {
        id: 'mindfulness-pain',
        title: 'Mindfulness-Based Pain Management',
        description: 'Mindfulness meditation and acceptance-based approaches for pain management',
        pillar: 'stress_management',
        timeframe: '8 weeks',
        priority: 'important',
        prerequisites: ['Willingness to engage', 'Basic instruction completed'],
        expectedOutcomes: ['Reduced pain distress', 'Improved coping', 'Better emotional regulation'],
        patientInstructions: 'Practice daily mindfulness meditation and acceptance techniques',
        providerNotes: 'Mindfulness changes the relationship with pain rather than eliminating it'
      }
    ],
    monitoringCriteria: [
      {
        id: 'functional-disability',
        metric: 'Oswestry Disability Index',
        target: { value: 40, unit: 'points', operator: '<' },
        frequency: 'monthly',
        alertThresholds: { warning: 50, critical: 60 },
        dataSource: 'patient_reported'
      },
      {
        id: 'pain-interference',
        metric: 'Pain Interference Score',
        target: { value: 5, unit: 'out of 10', operator: '<' },
        frequency: 'weekly',
        alertThresholds: { warning: 7, critical: 8 },
        dataSource: 'patient_reported'
      },
      {
        id: 'activity-participation',
        metric: 'Daily Activity Participation',
        target: { value: 70, unit: '% of planned activities', operator: '>' },
        frequency: 'weekly',
        alertThresholds: { warning: 50, critical: 30 },
        dataSource: 'patient_reported'
      }
    ],
    outcomeMetrics: [
      'Functional improvement',
      'Pain interference reduction',
      'Quality of life enhancement',
      'Medication reduction',
      'Return to work rates'
    ],
    isActive: true
  }
];

// Helper functions for protocol management
export const getProtocolsByCategory = (category: string): MayoProtocol[] => {
  return MAYO_PROTOCOLS.filter(protocol => protocol.category === category);
};

export const getProtocolById = (id: string): MayoProtocol | undefined => {
  return MAYO_PROTOCOLS.find(protocol => protocol.id === id);
};

export const getHighEvidenceProtocols = (): MayoProtocol[] => {
  return MAYO_PROTOCOLS.filter(protocol => protocol.evidenceLevel === 'A');
};

export const searchProtocols = (query: string): MayoProtocol[] => {
  const lowercaseQuery = query.toLowerCase();
  return MAYO_PROTOCOLS.filter(protocol =>
    protocol.title.toLowerCase().includes(lowercaseQuery) ||
    protocol.description.toLowerCase().includes(lowercaseQuery) ||
    protocol.applicableConditions.some(condition =>
      condition.toLowerCase().includes(lowercaseQuery)
    )
  );
};