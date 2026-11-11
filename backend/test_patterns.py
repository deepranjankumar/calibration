from app.services.point_intelligence import point_analyzer

# Test 1: Two points on the FRONT of the body (e.g. Left Anterior Shin)
shin_points = [
    {'point': {'x': 0.1, 'y': -0.65, 'z': 0.08}},
    {'point': {'x': 0.1, 'y': -0.55, 'z': 0.09}}
]
res_shin = point_analyzer.analyze_pain_path(shin_points, path_type='LINE', affected_side='LEFT')
print('=== TEST 1: FRONT SHIN ===')
print('Pattern ID:', res_shin.get('pattern_id'))
print('Pattern Title:', res_shin.get('pattern_title_en'))
print('Differentials:', res_shin.get('differential_diagnosis'))

# Test 2: Two points on the FRONT CHEST & ABDOMEN
front_torso_points = [
    {'point': {'x': -0.1, 'y': 0.50, 'z': 0.15}}, # Chest
    {'point': {'x': -0.08, 'y': 0.28, 'z': 0.14}} # Abdomen
]
res_torso = point_analyzer.analyze_pain_path(front_torso_points, path_type='LINE', affected_side='RIGHT')
print('\n=== TEST 2: FRONT CHEST + ABDOMEN ===')
print('Pattern ID:', res_torso.get('pattern_id'))
print('Pattern Title:', res_torso.get('pattern_title_en'))
print('Differentials:', res_torso.get('differential_diagnosis'))

# Test 3: Points on the FRONT LEG (Thigh -> Knee -> Shin)
front_leg_points = [
    {'point': {'x': -0.12, 'y': -0.20, 'z': 0.10}}, # Thigh
    {'point': {'x': -0.11, 'y': -0.38, 'z': 0.09}}, # Knee
    {'point': {'x': -0.10, 'y': -0.60, 'z': 0.08}}  # Shin
]
res_leg = point_analyzer.analyze_pain_path(front_leg_points, path_type='LINE', affected_side='RIGHT')
print('\n=== TEST 3: FRONT EXTENSOR CHAIN ===')
print('Pattern ID:', res_leg.get('pattern_id'))
print('Pattern Title:', res_leg.get('pattern_title_en'))
print('Differentials:', res_leg.get('differential_diagnosis'))

# Test 4: Points on the BACK (Full Spine Posterior: Neck to Lumbar)
back_spine_points = [
    {'point': {'x': 0.0, 'y': 0.65, 'z': -0.06}}, # Neck
    {'point': {'x': 0.0, 'y': 0.28, 'z': -0.07}}  # Lumbar
]
res_spine = point_analyzer.analyze_pain_path(back_spine_points, path_type='LINE', affected_side='BILATERAL')
print('\n=== TEST 4: POSTERIOR SPINE ===')
print('Pattern ID:', res_spine.get('pattern_id'))
print('Pattern Title:', res_spine.get('pattern_title_en'))
print('Differentials:', res_spine.get('differential_diagnosis'))

