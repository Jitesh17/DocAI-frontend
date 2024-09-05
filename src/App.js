import React, { useState } from 'react';
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

function App() {
    const [prompt, setPrompt] = useState('');
    const [api, setApi] = useState('openai'); // Re-added API state handling
    const [response, setResponse] = useState('');
    const [documentContent, setDocumentContent] = useState(''); // State for extracted document content
    const [showDocumentContent, setShowDocumentContent] = useState(false); // State for toggling content view
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Handle file change and extract content when a file is uploaded
    const handleFileChange = async (e) => {
        const uploadedFile = e.target.files[0];  // Removed the file state
        if (uploadedFile) {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            try {
                setLoading(true);
                setError('');

                // Send the file to the backend for document extraction
                const result = await axios.post('http://localhost:5000/api/read-document', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (result.data.content) {
                    setDocumentContent(result.data.content); // Set content for display
                } else {
                    setDocumentContent('No content extracted.');
                }
            } catch (error) {
                setError('Error extracting document content. Please try again.');
                console.error('Error extracting document content', error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle API selection change
    const handleApiChange = (e) => {
        setApi(e.target.value);
    };

    // Handle form submission (Send to AI)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResponse('');

        const requestData = {
            prompt: prompt,  // Send the prompt
            api: api,  // Selected AI API
            documentContent: documentContent  // Already extracted document content
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

    return (
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom>AI Document Processor</Typography>

            {/* API Selection */}
            <FormControl fullWidth margin="normal" style={{paddingTop: '10px'}}>
                <InputLabel>Select AI API</InputLabel>
                <Select value={api} onChange={handleApiChange}>
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="claude">Claude AI</MenuItem>
                    <MenuItem value="custom">Custom Model</MenuItem>
                </Select>
            </FormControl>

            {/* File Upload */}
            <Box marginY={2}>
                <input type="file" onChange={handleFileChange} accept=".pdf,.docx,.xlsx" />
            </Box>

            {/* Toggle Button to Show/Hide Document Content */}
            {documentContent && (
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
            {showDocumentContent && documentContent && (
                <Box marginY={2}>
                    <Typography variant="h6">Extracted Document Content:</Typography>
                    <Box padding={2} border={1} borderColor="grey.300" borderRadius={4} bgcolor="grey.100">
                        <Typography variant="body1">{documentContent}</Typography>
                    </Box>
                </Box>
            )}

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
                <Button type="submit" variant="contained" color="primary" onClick={handleSubmit} disabled={loading || !documentContent}>
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
