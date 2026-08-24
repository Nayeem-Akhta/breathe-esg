import React, { useState } from 'react';
import api from '../services/api'; // <-- This is the path that was breaking it!

export default function Register({ onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            // Send the registration request to Spring Boot
            const response = await api.post('/auth/register', { username, email, password });
            
            setSuccessMessage('Account created successfully! You can now log in.');
            // Clear the form
            setUsername('');
            setEmail('');
            setPassword('');
        } catch (error) {
            console.error("Registration failed:", error);
            if (error.response && error.response.data) {
                setErrorMessage(typeof error.response.data === 'string' ? error.response.data : 'Registration failed. Please try again.');
            } else {
                setErrorMessage('Network error. Is the backend running?');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-base)' }}>
            <div style={{ background: 'rgba(8,12,16,0.85)', padding: '40px', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontFamily: 'var(--font-display)' }}>Create Account</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>Join the BreatheESG Platform</p>
                
                {errorMessage && <div style={{ color: '#ff4d4f', marginBottom: '15px', fontSize: '14px', background: 'rgba(255,77,79,0.1)', padding: '10px', borderRadius: '4px' }}>{errorMessage}</div>}
                {successMessage && <div style={{ color: 'var(--green)', marginBottom: '15px', fontSize: '14px', background: 'rgba(52,211,153,0.1)', padding: '10px', borderRadius: '4px' }}>{successMessage}</div>}
                
                <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '13px' }}>Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '13px' }}>Email</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '13px' }}>Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{ width: '100%', padding: '12px', background: 'var(--green)', color: 'black', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: isLoading ? 0.7 : 1 }}
                    >
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <button 
                        onClick={onSwitchToLogin}
                        style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                    >
                        Log in here
                    </button>
                </div>
            </div>
        </div>
    );
}