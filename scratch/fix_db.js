const fs = require('fs');
const path = './frontend/data/giao-an.json';
const db = JSON.parse(fs.readFileSync(path, 'utf8'));

db.schedule.forEach(month => {
  ['push', 'pull', 'legs'].forEach(day => {
    ['A', 'B'].forEach(session => {
      const sess = month.days[day] && month.days[day][session];
      if (sess && sess.exercises) {
        sess.exercises.forEach(e => {
          if (e.nameEn && e.nameEn.includes('Hanging Leg Raise')) {
            if (e.duration) {
              e.reps = 15;
              e.unit = 'reps';
              delete e.duration;
              console.log('Fixed duration to reps for', e.nameEn, 'in Month', month.month, day, session);
            }
          }
        });
      }
    });
  });
});

fs.writeFileSync(path, JSON.stringify(db, null, 2));
console.log('Done!');
