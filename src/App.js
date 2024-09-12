import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, getIdToken } from 'firebase/auth'; // Import signUp method
import { auth } from './firebase'; 
import {
    Button,
    TextField,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Typography,
    Box,
    Container,
    CircularProgress,
    Alert,
    Switch,
    FormControlLabel
} from '@mui/material';

const LOCAL_API_BASE_URL = "http://localhost:5000";
const HOSTED_API_BASE_URL = "https://docai-backend.onrender.com";

function App() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [apiUrl, setApiUrl] = useState(HOSTED_API_BASE_URL);
    const [documentContents, setDocumentContents] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [api, setApi] = useState('openai');
    const [response, setResponse] = useState('');
    const [showDocumentContent, setShowDocumentContent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadedDocuments, setUploadedDocuments] = useState([]);
    const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
    const [useFrontendApiKey, setUseFrontendApiKey] = useState(false);
    const [openAiApiKey, setOpenAiApiKey] = useState('');
    const [claudeApiKey, setClaudeApiKey] = useState('');

    const fetchDocuments = useCallback(async () => {
        if (!user) return;

        const token = await getIdToken(user); 
    
        try {
            const result = await axios.get(`${apiUrl}/api/uploaded-documents`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUploadedDocuments(result.data.documents);
        } catch (error) {
            console.error('Error fetching documents', error);
        }
    }, [apiUrl, user]);
    
    useEffect(() => {
        fetchDocuments();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [fetchDocuments]);

    const handleDocumentSelection = (e) => {
        setSelectedDocumentIds([...e.target.selectedOptions].map(option => option.value));
    };

    const handleSignIn = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError('Sign in failed. Please check your credentials.');
        }
    };

    const handleSignUp = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setError('');
        } catch (error) {
            setError('Sign up failed. Try again with a different email.');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            setError('Sign out failed.');
        }
    };

    const handleDeleteDocuments = async () => {
        if (selectedDocumentIds.length === 0) {
            alert('Please select at least one document to delete.');
            return;
        }

        try {
            const token = await getIdToken(user); // Get the current user's token

            const result = await axios.delete(`${apiUrl}/api/delete-documents`, {
                data: { documentIds: selectedDocumentIds },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (result.data.success) {
                setUploadedDocuments(prevDocs => prevDocs.filter(doc => !selectedDocumentIds.includes(doc._id)));
                setSelectedDocumentIds([]);
            }
        } catch (error) {
            console.error('Error deleting documents', error);
        }
    };

    const handleFileChange = async (e) => {
        if (!user) return;
    
        const uploadedFiles = e.target.files;
        
        if (uploadedFiles.length === 0) {
            setError('No files selected.');
            return;
        }
        
        const formData = new FormData();
        for (let i = 0; i < uploadedFiles.length; i++) {
            formData.append('files', uploadedFiles[i]);
        }
    
        try {
            setLoading(true);
            setError('');
    
            const token = await getIdToken(user);
            console.log('Firebase token:', token);
    
            // Send files to backend for processing
            const result = await axios.post(`${apiUrl}/api/read-document`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
    
            console.log('API response:', result.data);
    
            if (result.data.contents) {
                setDocumentContents(result.data.contents);
                fetchDocuments(); 
            } else {
                setDocumentContents(['No content extracted.']);
            }
        } catch (error) {
            setError('Error extracting document content. Please try again.');
            console.error('Error extracting document content:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResponse('');
    
        if (!user) {
            setError('You must be signed in to make requests.');
            setLoading(false);
            return;
        }
    
        if (!selectedDocumentIds || selectedDocumentIds.length === 0) {
            setError('No documents selected.');
            setLoading(false);
            return;
        }
    
        try {
            const token = await getIdToken(user); 
            
            const requestData = {
                api,
                prompt,
                selectedDocumentIds, 
                useFrontendApiKey,
                openAiApiKey,
                claudeApiKey
            };
    
            const result = await axios.post(
                `${apiUrl}/api/send-to-ai`,
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
    
            console.log('API response:', result); 
            setResponse(result.data.message);
        } catch (error) {
            console.error('Error details:', error);
            if (error.response) {
                const errorMessage = error.response.data?.error?.message || 'Unexpected response error';
                setError(`AI request failed with status ${error.response.status}: ${errorMessage}`);
            } else if (error.request) {
                setError('No response received from AI service.');
            } else {
                setError(`Error processing AI request: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };
    
    
    const handleToggleChange = () => {
        setShowDocumentContent(prev => !prev);
    };

    const handleApiKeyToggle = () => {
        setUseFrontendApiKey(prev => !prev);
    };

    const handleApiUrlToggle = () => {
        setApiUrl(prevUrl => prevUrl === LOCAL_API_BASE_URL ? HOSTED_API_BASE_URL : LOCAL_API_BASE_URL);
    };

    if (!user) {
        return (
            <Container maxWidth="sm">
                <Typography variant="h4" gutterBottom>Sign In to Access the App</Typography>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth margin="normal" />
                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth margin="normal" />
                <Box marginY={2}>
                    <Button onClick={handleSignIn} variant="contained" color="primary" style={{ marginRight: '10px' }}>Sign In</Button>
                    <Button onClick={handleSignUp} variant="contained" color="secondary">Sign Up</Button>
                </Box>
            </Container>
        );
    }
    
    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom>AI Document Processor</Typography>

            {user ? (
                <>
                    <Typography>Signed in as: {user.email}</Typography>
                    <Button onClick={handleSignOut} variant="contained" color="secondary">Sign Out</Button>
                </>
            ) : (
                <>
                    <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
                    <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
                    <Box marginY={2}>
                        <Button onClick={handleSignIn} variant="contained" color="primary" style={{ marginRight: '10px' }}>Sign In</Button>
                        <Button onClick={handleSignUp} variant="contained" color="secondary">Sign Up</Button>
                    </Box>
                </>
            )}

            <Box marginY={2}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={apiUrl === HOSTED_API_BASE_URL}
                            onChange={handleApiUrlToggle}
                            color="primary"
                        />
                    }
                    label={apiUrl === HOSTED_API_BASE_URL ? "Using Hosted Backend" : "Using Local Backend"}
                />
            </Box>

            <FormControl fullWidth margin="normal">
                <InputLabel>Select AI API</InputLabel>
                <Select value={api} onChange={(e) => setApi(e.target.value)}>
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="claude">Claude AI</MenuItem>
                    <MenuItem value="custom">Custom Model</MenuItem>
                </Select>
            </FormControl>

            <Box marginY={2}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={useFrontendApiKey}
                            onChange={handleApiKeyToggle}
                            color="primary"
                        />
                    }
                    label="Use my API Key"
                />
            </Box>

            {useFrontendApiKey && (
                <>
                    {api === 'openai' && (
                        <TextField
                            label="OpenAI API Key"
                            fullWidth
                            value={openAiApiKey}
                            onChange={(e) => setOpenAiApiKey(e.target.value)}
                            margin="normal"
                            variant="outlined"
                        />
                    )}
                    {api === 'claude' && (
                        <TextField
                            label="Claude API Key"
                            fullWidth
                            value={claudeApiKey}
                            onChange={(e) => setClaudeApiKey(e.target.value)}
                            margin="normal"
                            variant="outlined"
                        />
                    )}
                </>
            )}

            <Box
                marginY={2}
                sx={{
                    border: '2px dashed grey',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#f5f5f5',
                    '&:hover': { backgroundColor: '#e0e0e0' }
                }}
                onClick={() => document.getElementById('fileUpload').click()}
            >
                <Typography variant="h6">Click or Drag & Drop Files Here</Typography>
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.xlsx"
                    style={{ display: 'none' }}
                    id="fileUpload"
                />
            </Box>

            {documentContents.length > 0 && (
                <Box marginY={2}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showDocumentContent}
                                onChange={handleToggleChange}
                                color="primary"
                            />
                        }
                        label="Show Document Content"
                    />
                </Box>
            )}

            {showDocumentContent && documentContents.length > 0 && (
                <Box marginY={2}>
                    <Typography variant="h6">Extracted Document Content:</Typography>
                    {documentContents.map((content, idx) => (
                        <Box key={idx} padding={2} border={1} borderColor="grey.300" borderRadius={4} bgcolor="grey.100">
                            <Typography variant="body1">{content}</Typography>
                        </Box>
                    ))}
                </Box>
            )}

            <FormControl fullWidth margin="normal">
                <InputLabel>Select Uploaded Documents</InputLabel>
                <Select multiple native onChange={handleDocumentSelection}>
                    {uploadedDocuments.map(doc => (
                        <option key={doc._id} value={doc._id}>
                            {doc.documentName}
                        </option>
                    ))}
                </Select>
            </FormControl>

            <Box marginY={2}>
                <Button variant="contained" color="secondary" onClick={handleDeleteDocuments}>
                    Delete Selected Documents
                </Button>
            </Box>

            <TextField
                label="Prompt"
                fullWidth
                multiline
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                margin="normal"
                variant="outlined"
            />

            <Box marginY={2}>
                <Button type="submit" variant="contained" color="primary" onClick={handleSubmit} disabled={loading || (!documentContents.length && selectedDocumentIds.length === 0)}>
                    {loading ? <CircularProgress size={24} /> : 'Send to AI'}
                </Button>
            </Box>

            {error && (
                <Box marginY={2}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            )}

            {response && (
                <Box marginY={4}>
                    <Typography variant="h6">AI Response:</Typography>
                    <Typography>{response}</Typography>
                </Box>
            )}
        </Container>
    );
}

export default App;
