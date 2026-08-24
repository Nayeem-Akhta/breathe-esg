import React, { useState } from 'react';
import api from '../services/api'; // This goes up one folder from 'components' to find api.js

export default function Login({ onLoginSuccess, onSwitchToRegister })  {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            // We use standard axios here or the unauthenticated route if api.js intercepts it
            const response = await api.post('/auth/login', { username, password });
            
            // 1. Log the exact response to the console to see what Spring Boot sent
            console.log("Backend Login Response:", response.data);
            
            // 2. Safely grab the token whether Spring Boot named it 'token' or 'accessToken'
            const token = response.data.token || response.data.accessToken;
            
            if (token) {
                // 3. Save it to Local Storage with the exact key your api.js interceptor is looking for
                localStorage.setItem('accessToken', token);
                
                // 4. Trigger the app to show the dashboard
                onLoginSuccess();
            } else {
                setErrorMessage("Login successful, but no token was found in the response!");
            }
            
        } catch (error) {
            console.error("Login failed:", error);
            setErrorMessage(error.response?.data?.error || 'Invalid credentials or backend offline');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-base)' }}>
            <div style={{ background: 'rgba(8,12,16,0.85)', padding: '40px', borderRadius: '8px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px', fontFamily: 'var(--font-display)' }}>Login to BreatheESG</h2>
                
                {errorMessage && <div style={{ color: '#ff4d4f', marginBottom: '15px', fontSize: '14px' }}>{errorMessage}</div>}
                
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}
                        />
                    </div>
                    
                    <button type="submit" style={{ width: '100%', padding: '12px', background: 'var(--green)', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Access Platform
                    </button>
                </form>
                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Don't have an account?{' '}
                    <button 
                        onClick={onSwitchToRegister}
                        style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                    >
                        Sign up here
                    </button>
                </div>
            </div>
        </div>
    );
}