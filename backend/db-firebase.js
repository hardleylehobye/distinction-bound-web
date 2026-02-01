// Firebase (Firestore) database adapter - same interface as db-mysql.js
// Uses Firebase Admin SDK. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON

const admin = require('firebase-admin');

// Initialize Firebase Admin (service account from env or file)
function getCredential() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return admin.credential.cert(JSON.parse(json));
    } catch (e) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
    }
  }
  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: getCredential(),
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT
  });
}

const firestore = admin.firestore();

// Convert Firestore Timestamp to ISO string
function serializeValue(v) {
  if (v && typeof v.toDate === 'function') return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(serializeValue);
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const out = {};
    for (const key of Object.keys(v)) out[key] = serializeValue(v[key]);
    return out;
  }
  return v;
}

// Snake case <-> camelCase for common fields (Firestore/frontend uses camelCase)
const TO_CAMEL = {
  course_id: 'courseId', session_id: 'sessionId', user_id: 'userId',
  start_time: 'startTime', end_time: 'endTime', total_seats: 'totalSeats',
  instructor_id: 'instructorId', created_at: 'createdAt', updated_at: 'updatedAt',
  enrolled_at: 'enrolledAt', purchased_at: 'purchasedAt', marked_at: 'markedAt',
  payment_method: 'paymentMethod', payment_id: 'paymentId', ticket_number: 'ticketNumber',
  amount_owed: 'amountOwed', amount_paid: 'amountPaid', payment_reference: 'paymentReference',
  paid_by: 'paidBy', paid_at: 'paidAt', file_url: 'fileUrl', video_url: 'videoUrl',
  enrollment_id: 'enrollmentId'
};
const TO_SNAKE = {};
Object.keys(TO_CAMEL).forEach(k => { TO_SNAKE[TO_CAMEL[k]] = k; });

function toFirestore(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = TO_CAMEL[k] || k;
    out[key] = v;
  }
  return out;
}

function fromFirestore(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...serializeValue(obj) };
  for (const [camel, snake] of Object.entries(TO_SNAKE)) {
    if (out[camel] !== undefined) {
      out[snake] = out[camel];
      delete out[camel];
    }
  }
  return out;
}

// Document ID field per collection (for get-by-id and setDoc)
const DOC_ID_FIELD = {
  users: 'uid',
  courses: 'course_id',
  sessions: 'session_id',
  enrollments: 'enrollment_id',
  purchases: 'ticket_number',
  attendance: null,
  notes: null,
  videos: null,
  payouts: null
};

function getDocIdField(table) {
  return DOC_ID_FIELD[table];
}

async function findDocRef(collectionRef, condition) {
  const condKeys = Object.keys(condition);
  if (condKeys.length === 0) return null;
  const field = condKeys[0];
  const value = condition[field];
  const firestoreField = TO_CAMEL[field] || field;
  const snap = await collectionRef.where(firestoreField, '==', value).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0];
}

const db = {
  async read(table) {
    const snap = await firestore.collection(table).get();
    return snap.docs.map(doc => {
      const data = fromFirestore(doc.data());
      return { id: doc.id, ...data };
    });
  },

  async findOne(table, condition) {
    const col = firestore.collection(table);
    const idField = getDocIdField(table);
    if (idField && condition[idField]) {
      const docId = condition[idField];
      const doc = await col.doc(docId).get();
      if (doc.exists) {
        const data = fromFirestore(doc.data());
        return { id: doc.id, ...data };
      }
      // Fall back to query (e.g. frontend-created docs with auto IDs)
    }
    const docSnap = await findDocRef(col, condition);
    if (!docSnap) return null;
    const data = fromFirestore(docSnap.data());
    return { id: docSnap.id, ...data };
  },

  async find(table, condition = {}) {
    if (Object.keys(condition).length === 0) return this.read(table);
    const col = firestore.collection(table);
    const entries = Object.entries(condition);
    let q = col;
    for (const [key, value] of entries) {
      const firestoreField = TO_CAMEL[key] || key;
      q = q.where(firestoreField, '==', value);
    }
    const snap = await q.get();
    return snap.docs.map(doc => {
      const data = fromFirestore(doc.data());
      return { id: doc.id, ...data };
    });
  },

  async insert(table, record) {
    const col = firestore.collection(table);
    const idField = getDocIdField(table);
    const data = toFirestore({ ...record, created_at: new Date().toISOString() });
    let docRef;
    if (idField && record[idField]) {
      docRef = col.doc(record[idField]);
      await docRef.set(data);
    } else {
      docRef = await col.add(data);
    }
    const inserted = await docRef.get();
    const out = fromFirestore(inserted.data());
    return { id: inserted.id, ...out };
  },

  async update(table, condition, updates) {
    const col = firestore.collection(table);
    const docSnap = await findDocRef(col, condition);
    if (!docSnap) {
      const idField = getDocIdField(table);
      if (idField && condition[idField]) {
        const docRef = col.doc(condition[idField]);
        const d = await docRef.get();
        if (d.exists) {
          const data = toFirestore({ ...updates, updated_at: new Date().toISOString() });
          await docRef.update(data);
          const updated = await docRef.get();
          return { id: updated.id, ...fromFirestore(updated.data()) };
        }
      }
      return null;
    }
    const data = toFirestore({ ...updates, updated_at: new Date().toISOString() });
    await docSnap.ref.update(data);
    const updated = await docSnap.ref.get();
    return { id: updated.id, ...fromFirestore(updated.data()) };
  },

  async delete(table, condition) {
    const col = firestore.collection(table);
    const idField = getDocIdField(table);
    if (idField && condition[idField]) {
      const docRef = col.doc(condition[idField]);
      const d = await docRef.get();
      if (d.exists) {
        await docRef.delete();
        return true;
      }
      return false;
    }
    const docSnap = await findDocRef(col, condition);
    if (!docSnap) return false;
    await docSnap.ref.delete();
    return true;
  }
};

console.log('✓ Firebase (Firestore) database initialized');
module.exports = db;
