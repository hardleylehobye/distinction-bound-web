const fs = require('fs');
const path = require('path');

// Database file paths
const dbDir = path.join(__dirname, 'data');
const dbFiles = {
  users: path.join(dbDir, 'users.json'),
  courses: path.join(dbDir, 'courses.json'),
  sessions: path.join(dbDir, 'sessions.json'),
  enrollments: path.join(dbDir, 'enrollments.json'),
  notes: path.join(dbDir, 'notes.json'),
  videos: path.join(dbDir, 'videos.json'),
  purchases: path.join(dbDir, 'purchases.json'),
  attendance: path.join(dbDir, 'attendance.json'),
  payouts: path.join(dbDir, 'payouts.json'),
};

// Create data directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database files with sample data
const initializeDB = () => {
  const initialData = {
    users: [
      { id: 1, uid: 'admin001', email: 'hardleylehobye@gmail.com', name: 'Hardley Lehobye', role: 'admin', blocked: false, created_at: new Date().toISOString() },
      { id: 2, uid: 'student001', email: '2542228@students.wits.ac.za', name: 'Student User', role: 'student', blocked: false, created_at: new Date().toISOString() },
      { id: 3, uid: 'instructor001', email: 'thabangth2003@gmail.com', name: 'Thabang Instructor', role: 'instructor', blocked: false, created_at: new Date().toISOString() }
    ],
    courses: [
      { id: 1, course_id: 'MATH101', title: 'Mathematics 101', description: 'Introduction to Mathematics', price: 500.00, created_at: new Date().toISOString() }
    ],
    sessions: [
      { 
        id: 1, 
        session_id: 'SESSION001', 
        course_id: 'MATH101', 
        title: 'Algebra Basics', 
        date: '2026-02-01', 
        start_time: '10:00:00', 
        end_time: '12:00:00', 
        venue: 'Room 101', 
        total_seats: 30, 
        enrolled: 0, 
        price: 150.00, 
        topics: ['Equations', 'Functions', 'Graphs'],
        created_at: new Date().toISOString()
      }
    ],
    enrollments: [],
    notes: [],
    videos: [],
    purchases: [],
    attendance: [],
    payouts: []
  };

  Object.keys(dbFiles).forEach(key => {
    if (!fs.existsSync(dbFiles[key])) {
      fs.writeFileSync(dbFiles[key], JSON.stringify(initialData[key] || [], null, 2));
      console.log(`✓ Created ${key}.json`);
    }
  });
};

// Initialize database
initializeDB();

// Database operations
const db = {
  // Read data from file
  read(table) {
    try {
      const data = fs.readFileSync(dbFiles[table], 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${table}:`, error);
      return [];
    }
  },

  // Write data to file
  write(table, data) {
    try {
      fs.writeFileSync(dbFiles[table], JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${table}:`, error);
      return false;
    }
  },

  // Find one record
  findOne(table, condition) {
    const data = this.read(table);
    return data.find(item => {
      return Object.keys(condition).every(key => item[key] === condition[key]);
    });
  },

  // Find multiple records
  find(table, condition = {}) {
    const data = this.read(table);
    if (Object.keys(condition).length === 0) return data;
    
    return data.filter(item => {
      return Object.keys(condition).every(key => item[key] === condition[key]);
    });
  },

  // Insert record
  insert(table, record) {
    const data = this.read(table);
    const newId = data.length > 0 ? Math.max(...data.map(r => r.id)) + 1 : 1;
    const newRecord = { 
      id: newId, 
      ...record, 
      created_at: new Date().toISOString() 
    };
    data.push(newRecord);
    this.write(table, data);
    return newRecord;
  },

  // Update record
  update(table, condition, updates) {
    const data = this.read(table);
    const index = data.findIndex(item => {
      return Object.keys(condition).every(key => item[key] === condition[key]);
    });
    
    if (index !== -1) {
      data[index] = { ...data[index], ...updates, updated_at: new Date().toISOString() };
      this.write(table, data);
      return data[index];
    }
    return null;
  },

  // Delete record
  delete(table, condition) {
    const data = this.read(table);
    const filtered = data.filter(item => {
      return !Object.keys(condition).every(key => item[key] === condition[key]);
    });
    this.write(table, filtered);
    return filtered.length < data.length;
  }
};

console.log('✓ JSON file database initialized');

module.exports = db;
