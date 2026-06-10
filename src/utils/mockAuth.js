// Mock Authentication Service using LocalStorage
const STORAGE_KEY = 'apexwatch_mock_users';

const getUsers = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const saveUsers = (users) => localStorage.setItem(STORAGE_KEY, JSON.stringify(users));

export const mockAuth = {
 signUp: async (email, password, name) => {
 await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
 const users = getUsers();
 if (users.find(u => u.email === email)) throw new Error('Email already in use.');
 
 const newUser = {
 uid: Math.random().toString(36).substr(2, 9),
 email,
 password, // In a real app, never store plain text passwords!
 displayName: name,
 photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
 createdAt: new Date().toISOString()
 };
 
 users.push(newUser);
 saveUsers(users);
 return { user: newUser };
 },

 signIn: async (email, password) => {
 await new Promise(resolve => setTimeout(resolve, 800));
 const users = getUsers();
 const user = users.find(u => u.email === email && u.password === password);
 if (!user) throw new Error('Invalid email or password.');
 return { user };
 },

 loginWithGoogle: async () => {
 await new Promise(resolve => setTimeout(resolve, 1000));
 return {
 user: {
 uid: 'google-user-123',
 email: 'google-user@gmail.com',
 displayName: 'Google User',
 photoURL: 'https://ui-avatars.com/api/?name=Google+User&background=4285F4&color=fff'
 }
 };
 }
};
