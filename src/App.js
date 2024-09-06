import React, { useState, useEffect } from 'react';
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

const API_BASE_URL = "https://docai-backend.onrender.com";  // Render backend URL

function App() {
    // const [files, setFiles] = useState([]); // Handle multiple file uploads
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

    // Fetch all uploaded documents on load
    const fetchDocuments = async () => {
        try {
            const result = await axios.get('http://localhost:5000/api/uploaded-documents');
            setUploadedDocuments(result.data.documents);
        } catch (error) {
            console.error('Error fetching documents', error);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

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
            const result = await axios.delete('http://localhost:5000/api/delete-documents', {
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
        // setFiles(uploadedFiles);
        const formData = new FormData();
        for (let i = 0; i < uploadedFiles.length; i++) {
            formData.append('files', uploadedFiles[i]); // Ensure the input name is 'files'
        }

        try {
            setLoading(true);
            setError('');

            // Send the files to the backend for document extraction
            const result = await axios.post('http://localhost:5000/api/read-document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (result.data.contents) {
                setDocumentContents(result.data.contents); 
                fetchDocuments(); 
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
            const result = await axios.post('http://localhost:5000/api/send-to-ai', requestData);
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

    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom>AI Document Processor</Typography>

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
            <Box marginY={2}>
                <input type="file" multiple onChange={handleFileChange} accept=".pdf,.docx,.xlsx" />
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
