// NIHSS item definitions. Per NIHSS scoring rules, limb motor items (5a-6b) and
// limb ataxia (7) may be scored UN only for amputation or joint fusion; dysarthria
// (10) only for intubation or another physical barrier. UN items are not summed.
export const NIHSS_ITEMS = [
            { id: 'consciousness', name: '1a. Level of Consciousness', options: ['Alert (0)', 'Drowsy (1)', 'Stuporous (2)', 'Coma (3)'] },
            { id: 'loc_questions', name: '1b. LOC Questions', options: ['Both correct (0)', 'One correct (1)', 'Neither correct (2)'] },
            { id: 'loc_commands', name: '1c. LOC Commands', options: ['Obeys both correctly (0)', 'Obeys one correctly (1)', 'Neither correctly (2)'] },
            { id: 'best_gaze', name: '2. Best Gaze', options: ['Normal (0)', 'Partial gaze palsy (1)', 'Forced deviation (2)'] },
            { id: 'visual', name: '3. Visual', options: ['No visual loss (0)', 'Partial hemianopia (1)', 'Complete hemianopia (2)', 'Bilateral hemianopia (3)'] },
            { id: 'facial_palsy', name: '4. Facial Palsy', options: ['Normal (0)', 'Minor asymmetry (1)', 'Partial facial paralysis (2)', 'Complete facial paralysis (3)'] },
            { id: 'motor_arm_left', name: '5a. Motor Arm-Left', options: ['No drift (0)', 'Drift (1)', 'Some effort against gravity (2)', 'No effort against gravity (3)', 'No movement (4)', 'Amputation/joint fusion (UN)'] },
            { id: 'motor_arm_right', name: '5b. Motor Arm-Right', options: ['No drift (0)', 'Drift (1)', 'Some effort against gravity (2)', 'No effort against gravity (3)', 'No movement (4)', 'Amputation/joint fusion (UN)'] },
            { id: 'motor_leg_left', name: '6a. Motor Leg-Left', options: ['No drift (0)', 'Drift (1)', 'Some effort against gravity (2)', 'No effort against gravity (3)', 'No movement (4)', 'Amputation/joint fusion (UN)'] },
            { id: 'motor_leg_right', name: '6b. Motor Leg-Right', options: ['No drift (0)', 'Drift (1)', 'Some effort against gravity (2)', 'No effort against gravity (3)', 'No movement (4)', 'Amputation/joint fusion (UN)'] },
            { id: 'limb_ataxia', name: '7. Limb Ataxia', options: ['Absent (0)', 'Present in upper or lower (1)', 'Present in both (2)', 'Amputation/joint fusion (UN)'] },
            { id: 'sensory', name: '8. Sensory', options: ['Normal (0)', 'Partial loss (1)', 'Dense loss (2)'] },
            { id: 'language', name: '9. Best Language†', options: ['No aphasia (0)', 'Mild-moderate aphasia (1)', 'Severe aphasia (2)', 'Mute, global aphasia (3)'] },
            { id: 'dysarthria', name: '10. Dysarthria†', options: ['Normal articulation (0)', 'Mild-moderate slurring (1)', 'Severe dysarthria (2)', 'Intubated/other (UN)'] },
            { id: 'extinction', name: '11. Extinction and Inattention', options: ['No neglect (0)', 'Visual, tactile, auditory, spatial, or personal inattention (1)', 'Profound hemi-inattention (2)'] }
          ];
