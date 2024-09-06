import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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

// Add both local and hosted backend URLs
const LOCAL_API_BASE_URL = "http://localhost:5000";  // Local backend URL
const HOSTED_API_BASE_URL = "https://docai-backend.onrender.com";  // Render backend URL

function App() {
    const [apiUrl, setApiUrl] = useState(HOSTED_API_BASE_URL);  // State to switch between local and hosted API
    const [documentContents, setDocumentContents] = useState([]); // State for multiple extracted document contents
    const [prompt, setPrompt] = useState('');
    const [api, setApi] = useState('openai');
    const [response, setResponse] = useState('');
    const [showDocumentContent, setShowDocumentContent] = useState(false); // For toggling document view
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadedDocuments, setUploadedDocuments] = useState([]); // List of uploaded documents
    const [selectedDocumentIds, setSelectedDocumentIds] = useState([]); // IDs of selected documents
    const [useFrontendApiKey, setUseFrontendApiKey] = useState(false); // Toggle to use frontend API key
    const [openAiApiKey, setOpenAiApiKey] = useState('');
    const [claudeApiKey, setClaudeApiKey] = useState('');

    const fetchDocuments = useCallback(async () => {
        try {
            const result = await axios.get(`${apiUrl}/api/uploaded-documents`);
            setUploadedDocuments(result.data.documents);
        } catch (error) {
            console.error('Error fetching documents', error);
        }
    }, [apiUrl]);
    
    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]); 

    // Handle document selection from dropdown
    const handleDocumentSelection = (e) => {
        setSelectedDocumentIds([...e.target.selectedOptions].map(option => option.value));
    };

    // Handle document deletion
    const handleDeleteDocuments = async () => {
        if (selectedDocumentIds.length === 0) {
            alert('Please select at least one document to delete.');
            return;
        }

        try {
            const result = await axios.delete(`${apiUrl}/api/delete-documents`, {
                data: { documentIds: selectedDocumentIds }  // Send selected document IDs in the request body
            });

            if (result.data.success) {
                // Remove the deleted documents from the local state
                setUploadedDocuments(prevDocs => prevDocs.filter(doc => !selectedDocumentIds.includes(doc._id)));
                setSelectedDocumentIds([]); // Clear the selected documents
            }
        } catch (error) {
            console.error('Error deleting documents', error);
        }
    };

    // Handle file change for multiple files
    const handleFileChange = async (e) => {
        const uploadedFiles = e.target.files;
        const formData = new FormData();
        for (let i = 0; i < uploadedFiles.length; i++) {
            formData.append('files', uploadedFiles[i]); // Ensure the input name is 'files'
        }

        try {
            setLoading(true);
            setError('');

            // Send the files to the backend for document extraction
            const result = await axios.post(`${apiUrl}/api/read-document`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (result.data.contents) {
                setDocumentContents(result.data.contents); 
                fetchDocuments();  // Update the document list after upload
            } else {
                setDocumentContents(['No content extracted.']);
            }
        } catch (error) {
            setError('Error extracting document content. Please try again.');
            console.error('Error extracting document content', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission (Send to AI)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResponse('');

        const requestData = {
            prompt: prompt,
            api: api,
            selectedDocumentIds: selectedDocumentIds,  // Previously selected document IDs
            documentContents: documentContents.join('\n\n'), // Concatenated newly uploaded documents
            useFrontendApiKey: useFrontendApiKey,
            openAiApiKey: openAiApiKey,
            claudeApiKey: claudeApiKey
        };

        try {
            // Send the prompt and extracted content to the backend for AI processing
            const result = await axios.post(`${apiUrl}/api/send-to-ai`, requestData);
            setResponse(result.data.data.choices[0].text);
        } catch (error) {
            setError('Error processing AI request. Please try again.');
            console.error('Error processing AI request', error);
        } finally {
            setLoading(false);
        }
    };

    // Toggle the display of document content
    const handleToggleChange = () => {
        setShowDocumentContent((prev) => !prev);
    };

    // Toggle API key input source
    const handleApiKeyToggle = () => {
        setUseFrontendApiKey((prev) => !prev);
    };

    // Toggle API URL between local and hosted
    const handleApiUrlToggle = () => {
        setApiUrl(prevUrl => prevUrl === LOCAL_API_BASE_URL ? HOSTED_API_BASE_URL : LOCAL_API_BASE_URL);
    };

    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom>AI Document Processor</Typography>

            {/* Toggle Backend URL */}
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

            {/* API Selection */}
            <FormControl fullWidth margin="normal" style={{ paddingTop: '10px' }}>
                <InputLabel>Select AI API</InputLabel>
                <Select value={api} onChange={(e) => setApi(e.target.value)}>
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="claude">Claude AI</MenuItem>
                    <MenuItem value="custom">Custom Model</MenuItem>
                </Select>
            </FormControl>


            {/* Toggle Button to Use API Keys from Frontend */}
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

            {/* Conditionally Show API Key Inputs */}
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

            {/* File Upload */}
            <Box 
                marginY={2}
                sx={{
                    border: '2px dashed grey',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#f5f5f5',
                    '&:hover': {
                        backgroundColor: '#e0e0e0',
                    }
                }}
                onClick={() => document.getElementById('fileUpload').click()} // Trigger file input on box click
            >
                <Typography variant="h6">Click or Drag & Drop Files Here</Typography>
                <input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange} 
                    accept=".pdf,.docx,.xlsx" 
                    style={{ display: 'none' }} // Hide default input appearance
                    id="fileUpload"  // ID to trigger file input
                />
            </Box>


            {/* Toggle Button to Show/Hide Document Content */}
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

            {/* Conditionally Render Document Content */}
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

            {/* Uploaded Document Dropdown */}
            <FormControl fullWidth margin="normal" style={{ paddingTop: '20px' }}>
                <InputLabel>Select Uploaded Documents</InputLabel>
                <Select multiple native onChange={handleDocumentSelection}>
                    {uploadedDocuments.map(doc => (
                        <option key={doc._id} value={doc._id}>
                            {doc.documentName}
                        </option>
                    ))}
                </Select>
            </FormControl>

            {/* Delete Documents Button */}
            <Box marginY={2}>
                <Button variant="contained" color="secondary" onClick={handleDeleteDocuments}>
                    Delete Selected Documents
                </Button>
            </Box>

            {/* Prompt Input */}
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

            {/* Send to AI Button */}
            <Box marginY={2}>
                <Button type="submit" variant="contained" color="primary" onClick={handleSubmit} disabled={loading || (!documentContents.length && selectedDocumentIds.length === 0)} >
                    {loading ? <CircularProgress size={24} /> : 'Send to AI'}
                </Button>
            </Box>

            {/* Error Handling */}
            {error && (
                <Box marginY={2}>
                    <Alert severity="error">{error}</Alert>
                </Box>
            )}

            {/* AI Response */}
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
