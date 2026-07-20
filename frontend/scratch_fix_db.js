const manualMapping = {
  "Bench Press": "Barbell Bench Press",
  "Seated DB Shoulder Press": "Seated Dumbbell Press",
  "Incline DB Press": "Incline Dumbbell Press",
  "Lateral Raise": "Dumbbell Lateral Raise",
  "Tricep Pushdown": "Tricep Pushdown",
  "Plank": "Plank",
  "Flat DB Press": "Dumbbell Bench Press",
  "Pec Deck / Machine Fly": "Dumbbell Flyes", // Will copy from Dumbbell Flyes
  "DB Front Raise": "Dumbbell Front Raise",
  "DB Tricep Kickback": "Tricep Pushdown",
  "Barbell Row": "Barbell Row",
  "Pull-up / Lat Pulldown": "Lat Pulldown",
  "Seated Cable Row": "Seated Cable Row",
  "Face Pull": "Face Pull",
  "EZ-bar Curl": "Barbell Curl",
  "Hanging Leg Raise": "Hanging Leg Raise",
  "Chest-supported DB Row": "Dumbbell Row",
  "Wide-grip Lat Pulldown": "Lat Pulldown",
  "Cable Reverse Fly": "Reverse Pec Deck",
  "DB Preacher/Concentration Curl": "Dumbbell Curl",
  "Back Squat": "Back Squat",
  "Romanian Deadlift": "Romanian Deadlift",
  "Leg Press": "Leg Press",
  "Seated Leg Curl": "Seated Leg Curl",
  "Standing Calf Raise": "Standing Calf Raise",
  "Pallof Press": "Pallof Press",
  "Goblet Squat": "Front Squat", // Copy from Front Squat
  "Standing Leg Curl": "Standing Leg Curl",
  "Leg Extension": "Leg Extension",
  "DB Calf Raise": "Standing Calf Raise",
  "Cable Crossover": "Cable Crossover",
  "Cable Lateral Raise": "Cable Lateral Raise",
  "Skullcrusher": "Skull Crushers",
  "Machine Chest Press": "Machine Chest Press",
  "Incline DB Fly": "Dumbbell Flyes",
  "Arnold Press": "Seated Dumbbell Press",
  "Single-arm Cable Tricep Extension": "Tricep Pushdown",
  "Single-arm DB Row": "Dumbbell Row",
  "Reverse Pec Deck Fly": "Reverse Pec Deck",
  "Alternating DB Curl": "Dumbbell Curl",
  "Standing Single-arm Cable Row": "Seated Cable Row",
  "Close-grip / V-bar Pulldown": "Lat Pulldown",
  "Incline Bench Y-Raise": "Dumbbell Lateral Raise",
  "Cable Bar Curl": "Cable Curl",
  "Walking Lunge": "Dumbbell Lunge",
  "Lying Leg Curl": "Lying Leg Curl",
  "Seated Calf Raise": "Seated Calf Raise",
  "DB Step-up": "Dumbbell Lunge",
  "Single-leg Leg Extension": "Leg Extension",
  "Single-leg Standing Leg Curl": "Standing Leg Curl",
  "Single-leg DB Calf Raise": "Standing Calf Raise",
  "Dips": "Dips",
  "Leaning Cable Lateral Raise": "Cable Lateral Raise",
  "Overhead Tricep Extension": "Overhead Tricep Extension",
  "Weighted Plank": "Plank",
  "Decline DB Press": "Dumbbell Bench Press",
  "Single-arm Cable Fly": "Cable Crossover",
  "DB Y-Raise": "Dumbbell Lateral Raise",
  "Close-grip DB Floor Press": "Dumbbell Bench Press",
  "Straight-arm Pulldown": "Straight Arm Pulldown",
  "Bent-over DB Reverse Fly": "Reverse Pec Deck",
  "Cable Curl": "Cable Curl",
  "Hanging Leg Raise (straight leg)": "Hanging Leg Raise",
  "T-bar Row": "T-Bar Row",
  "Cross-body Cable Row": "Seated Cable Row",
  "Cross-body Cable Reverse Fly": "Reverse Pec Deck",
  "DB Hammer Curl": "Hammer Curl",
  "Bulgarian Split Squat": "Bulgarian Split Squat",
  "Single-leg Leg Curl": "Leg Curl",
  "Single-leg Calf Raise": "Standing Calf Raise",
  "Hack Squat": "Leg Press",
  "Heavy Leg Extension (drop-set last set)": "Leg Extension",
  "Single-leg Lying Leg Curl": "Lying Leg Curl",
  "Leg Press Calf Raise": "Seated Calf Raise"
};

const fs = require('fs');

const dbPath = './data/db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const giaoan = JSON.parse(fs.readFileSync('./data/giao-an.json', 'utf8'));

// Delete aliases from all exercises to undo previous wrong fix
db.exercises.forEach(e => {
    delete e.aliases;
});

// Gather all unique exercises from giao-an with their nameVi
const uniqueEx = new Map();
giaoan.months.forEach(m => {
  ['push', 'pull', 'legs'].forEach(day => {
     ['sessionA', 'sessionB'].forEach(sess => {
         const arr = m.days[day][sess];
         if (arr) {
             arr.forEach(ex => {
                 uniqueEx.set(ex.nameEn, ex.name);
             });
         }
     });
  });
});

for (const [nameEn, nameVi] of uniqueEx.entries()) {
    // If the exact name En doesn't exist in db.json
    let existing = db.exercises.find(e => e.name === nameEn);
    if (!existing) {
        // Find the closest template
        const templateName = manualMapping[nameEn];
        const template = db.exercises.find(e => e.name === templateName);
        if (template) {
            const newEx = JSON.parse(JSON.stringify(template));
            newEx.name = nameEn;
            newEx.nameVi = [nameVi];
            db.exercises.push(newEx);
            console.log(`Created new exercise: ${nameEn}`);
        } else {
            console.error(`Could not find template ${templateName} for ${nameEn}`);
        }
    }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully fixed db.json!');
