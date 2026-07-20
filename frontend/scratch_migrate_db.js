const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyADilxEdCBT6tdT63AOZexOI9ZmDTjE8q0",
  authDomain: "fitness-c4d75.firebaseapp.com",
  projectId: "fitness-c4d75",
  storageBucket: "fitness-c4d75.firebasestorage.app",
  messagingSenderId: "721913794597",
  appId: "1:721913794597:web:88b7a3aa9a7407866defcc",
  measurementId: "G-15DLV05SNK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log('Fetching all workouts...');
  const snap = await getDocs(collection(db, 'workouts'));
  const workouts = [];
  snap.forEach(d => {
    workouts.push({ id: d.id, ...d.data() });
  });

  // Sort by date ascending (oldest first)
  workouts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Track session counts: "push-A" -> count
  const counts = {};

  for (const w of workouts) {
    if (w.status !== 'completed') continue;
    const key = `${w.day}-${w.session}`;
    if (!counts[key]) counts[key] = 0;
    
    // It's a completed session, increment count
    counts[key]++;
    
    const sessionNumber = counts[key];
    const cyclePos = (sessionNumber - 1) % 12; // 12 weeks = 1 macrocycle
    const month = Math.floor(cyclePos / 4) + 1; // 1, 2, or 3
    const totalWeek = cyclePos + 1;

    console.log(`Updating ${w.id} (Date: ${w.date}): ${key} #${sessionNumber} -> Week: ${totalWeek}, Month: ${month}`);

    // Update in firestore
    await updateDoc(doc(db, 'workouts', w.id), {
      week: totalWeek,
      month: month
    });
  }
  console.log('Migration completed!');
  process.exit(0);
}

migrate().catch(console.error);
