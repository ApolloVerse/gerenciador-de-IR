import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Asset, Transaction, DARF, UserProfile } from '../types';

export const dbService = {
  // User Profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProfile : null;
  },

  async createUserProfile(profile: UserProfile): Promise<void> {
    const docRef = doc(db, 'users', profile.uid);
    await setDoc(docRef, {
      ...profile,
      createdAt: serverTimestamp()
    });
  },

  // Assets
  subscribeToAssets(uid: string, callback: (assets: Asset[]) => void) {
    const colRef = collection(db, 'users', uid, 'assets');
    return onSnapshot(colRef, (snapshot) => {
      const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
      callback(assets);
    });
  },

  async getAssets(uid: string): Promise<Asset[]> {
    const colRef = collection(db, 'users', uid, 'assets');
    const querySnapshot = await getDocs(colRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
  },

  async upsertAsset(uid: string, asset: Partial<Asset>): Promise<string> {
    // Precise ID: Ticker + CNPJ (if available) to distinguish variants but avoid duplicates
    const ticker = asset.ticker?.toUpperCase() || 'UNKNOWN';
    const cnpj = asset.cnpj?.replace(/\D/g, '') || 'GLOBAL';
    const id = asset.id || `${ticker}_${cnpj}`;
    
    const docRef = doc(db, 'users', uid, 'assets', id);
    
    await setDoc(docRef, { 
      ...asset, 
      id, 
      userId: uid, 
      lastUpdate: new Date().toISOString() 
    }, { merge: true });
    return id;
  },



  // Transactions
  subscribeToTransactions(uid: string, callback: (transactions: Transaction[]) => void) {
    const colRef = collection(db, 'users', uid, 'transactions');
    return onSnapshot(colRef, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      callback(transactions);
    });
  },

  async getTransactions(uid: string): Promise<Transaction[]> {
    const colRef = collection(db, 'users', uid, 'transactions');
    const querySnapshot = await getDocs(colRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  },

  async addTransaction(uid: string, transaction: Omit<Transaction, 'id'>): Promise<string> {
    const id = doc(collection(db, 'users', uid, 'transactions')).id;
    const docRef = doc(db, 'users', uid, 'transactions', id);
    await setDoc(docRef, { ...transaction, id });
    return id;
  },

  // Dividends
  subscribeToDividends(uid: string, callback: (dividends: any[]) => void) {
    const colRef = collection(db, 'users', uid, 'dividends');
    return onSnapshot(colRef, (snapshot) => {
      const dividends = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(dividends);
    });
  },

  async addDividend(uid: string, dividend: any): Promise<string> {
    const id = doc(collection(db, 'users', uid, 'dividends')).id;
    const docRef = doc(db, 'users', uid, 'dividends', id);
    await setDoc(docRef, { ...dividend, id, userId: uid });
    return id;
  },

  // DARFs
  subscribeToDARFs(uid: string, callback: (darfs: DARF[]) => void) {
    const colRef = collection(db, 'users', uid, 'darfs');
    return onSnapshot(colRef, (snapshot) => {
      const darfs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DARF));
      callback(darfs);
    });
  },

  async getDARFs(uid: string): Promise<DARF[]> {
    const colRef = collection(db, 'users', uid, 'darfs');
    const querySnapshot = await getDocs(colRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DARF));
  },

  async addDARF(uid: string, darf: Omit<DARF, 'id'>): Promise<string> {
    const id = doc(collection(db, 'users', uid, 'darfs')).id;
    const docRef = doc(db, 'users', uid, 'darfs', id);
    await setDoc(docRef, { ...darf, id });
    return id;
  },

  // Incomes (Rendimentos)
  subscribeToIncomes(uid: string, callback: (incomes: any[]) => void) {
    const colRef = collection(db, 'users', uid, 'incomes');
    return onSnapshot(colRef, (snapshot) => {
      const incomes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(incomes);
    });
  },

  async addIncome(uid: string, income: any): Promise<string> {
    const id = doc(collection(db, 'users', uid, 'incomes')).id;
    const docRef = doc(db, 'users', uid, 'incomes', id);
    await setDoc(docRef, { ...income, id, userId: uid, createdAt: new Date().toISOString() });
    return id;
  },

  // Upload Log
  subscribeToUploads(uid: string, callback: (uploads: any[]) => void) {
    const colRef = collection(db, 'users', uid, 'uploadLogs');
    return onSnapshot(colRef, (snapshot) => {
      const uploads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(uploads);
    });
  },

  async addUploadLog(uid: string, log: any): Promise<string> {
    const id = doc(collection(db, 'users', uid, 'uploadLogs')).id;
    const docRef = doc(db, 'users', uid, 'uploadLogs', id);
    await setDoc(docRef, { ...log, id, userId: uid, timestamp: serverTimestamp() });
    return id;
  },

  async updateDARFStatus(uid: string, darfId: string, status: 'PENDENTE' | 'PAGO' | 'ATRASADO'): Promise<void> {
    const docRef = doc(db, 'users', uid, 'darfs', darfId);
    await updateDoc(docRef, { status });
  }
};

