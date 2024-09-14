import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  getIdToken,
} from "firebase/auth";
import { auth } from "./firebase";
import ReactMarkdown from "react-markdown";
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
  FormControlLabel,
} from "@mui/material";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const LOCAL_API_BASE_URL = "http://localhost:5000";
const HOSTED_API_BASE_URL = "https://docai-backend.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiUrl, setApiUrl] = useState(HOSTED_API_BASE_URL);
  const [documentContents, setDocumentContents] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [api, setApi] = useState("openai");
  const [response, setResponse] = useState("");
  const [showDocumentContent, setShowDocumentContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [useFrontendApiKey, setUseFrontendApiKey] = useState(false);
  const [openAiApiKey, setOpenAiApiKey] = useState("");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [maxTokens, setMaxTokens] = useState(100);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:960px)");

  const fetchDocuments = useCallback(async () => {
    if (!user) return;

    const token = await getIdToken(user);

    try {
      const result = await axios.get(`${apiUrl}/api/uploaded-documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUploadedDocuments(result.data.documents);
    } catch (error) {
      console.error("Error fetching documents", error);
      setError("Failed to fetch documents. Please try again later.");
    }
  }, [apiUrl, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [fetchDocuments, user]);

  const handleDocumentSelection = (e) => {
    setSelectedDocumentIds(
      [...e.target.selectedOptions].map((option) => option.value)
    );
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError("Sign in failed. Please check your credentials.");
    }
  };

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setError("");
    } catch (error) {
      setError("Sign up failed. Try again with a different email.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUploadedDocuments([]);
    } catch (error) {
      setError("Sign out failed.");
    }
  };

  const handleDeleteDocuments = async () => {
    if (selectedDocumentIds.length === 0) {
      alert("Please select at least one document to delete.");
      return;
    }

    try {
      const token = await getIdToken(user); 

      const result = await axios.delete(`${apiUrl}/api/delete-documents`, {
        data: { documentIds: selectedDocumentIds },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (result.data.success) {
        setUploadedDocuments((prevDocs) =>
          prevDocs.filter((doc) => !selectedDocumentIds.includes(doc._id))
        );
        setSelectedDocumentIds([]);
      }
    } catch (error) {
      console.error("Error deleting documents", error);
    }
  };

  const handleFileChange = async (e) => {
    if (!user) return;

    const uploadedFiles = e.target.files;

    if (uploadedFiles.length === 0) {
      setError("No files selected.");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < uploadedFiles.length; i++) {
      formData.append("files", uploadedFiles[i]);
    }

    try {
      setLoading(true);
      setError("");

      const token = await getIdToken(user);
      console.log("Firebase token:", token);

      // Send files to backend for processing
      const result = await axios.post(`${apiUrl}/api/read-document`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API response:", result.data);

      if (result.data.contents) {
        setDocumentContents(result.data.contents);
        fetchDocuments();
      } else {
        setDocumentContents(["No content extracted."]);
      }
    } catch (error) {
      setError("Error extracting document content. Please try again.");
      console.error("Error extracting document content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse("");

    if (!user) {
      setError("You must be signed in to make requests.");
      setLoading(false);
      return;
    }

    if (!selectedDocumentIds || selectedDocumentIds.length === 0) {
      setError("No documents selected.");
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
        claudeApiKey,
        maxTokens,
      };

      const result = await axios.post(`${apiUrl}/api/send-to-ai`, requestData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("API response:", result);
      setResponse(result.data.message);
    } catch (error) {
      console.error("Error details:", error);
      if (error.response) {
        const errorMessage =
          error.response.data?.error?.message || "Unexpected response error";
        setError(
          `AI request failed with status ${error.response.status}: ${errorMessage}`
        );
      } else if (error.request) {
        setError("No response received from AI service.");
      } else {
        setError(`Error processing AI request: ${error.message}`);
        setError("AI request failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = () => {
    setShowDocumentContent((prev) => !prev);
  };

  const handleApiKeyToggle = () => {
    setUseFrontendApiKey((prev) => !prev);
  };

  const handleApiUrlToggle = () => {
    setApiUrl((prevUrl) =>
      prevUrl === LOCAL_API_BASE_URL ? HOSTED_API_BASE_URL : LOCAL_API_BASE_URL
    );
  };

  if (!user) {
    return (
      <Container maxWidth="sm">
        <Typography variant="h4" gutterBottom>
          Sign In to Access the App
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Box marginY={2}>
          <Button
            onClick={handleSignIn}
            variant="contained"
            color="primary"
            style={{ marginRight: "10px" }}
          >
            Sign In
          </Button>
          <Button onClick={handleSignUp} variant="contained" color="secondary">
            Sign Up
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* AppBar for mobile view */}
      <AppBar position="fixed" sx={{ display: { md: "none" } }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            AI Document Processor
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex" }}>
        {/* Sidebar Drawer */}
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true, // Better performance on mobile.
          }}
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: "auto", p: 2 }}>
            {/* Sidebar content */}
            {user && (
              <Box mb={4}>
                <Typography variant="subtitle1">Signed in as:</Typography>
                <Typography variant="h6" gutterBottom>
                  {user.email}
                </Typography>
                <Button
                  onClick={handleSignOut}
                  variant="contained"
                  color="secondary"
                  fullWidth
                >
                  Sign Out
                </Button>
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={apiUrl === HOSTED_API_BASE_URL}
                  onChange={handleApiUrlToggle}
                  color="primary"
                />
              }
              label={
                apiUrl === HOSTED_API_BASE_URL
                  ? "Using Hosted Backend"
                  : "Using Local Backend"
              }
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Select AI API</InputLabel>
              <Select value={api} onChange={(e) => setApi(e.target.value)}>
                <MenuItem value="openai">OpenAI</MenuItem>
                <MenuItem value="claude">Claude AI</MenuItem>
                <MenuItem value="custom">Custom Model</MenuItem>
              </Select>
            </FormControl>

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

            {useFrontendApiKey && (
              <Box mt={2}>
                {api === "openai" && (
                  <TextField
                    label="OpenAI API Key"
                    fullWidth
                    value={openAiApiKey}
                    onChange={(e) => setOpenAiApiKey(e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                )}
                {api === "claude" && (
                  <TextField
                    label="Claude API Key"
                    fullWidth
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKey(e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                )}
              </Box>
            )}
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - 240px)` },
          }}
        >
          {/* Offset for AppBar */}
          <Toolbar sx={{ display: { md: "none" } }} />

          <Typography variant="h4" gutterBottom>
            AI Document Processor
          </Typography>

          {!user && (
            <Box mb={4}>
              <TextField
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              <Box mt={2}>
                <Button
                  onClick={handleSignIn}
                  variant="contained"
                  color="primary"
                  sx={{ marginRight: "10px" }}
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleSignUp}
                  variant="outlined"
                  color="secondary"
                >
                  Sign Up
                </Button>
              </Box>
            </Box>
          )}

          <Box
            marginY={2}
            sx={{
              border: "2px dashed grey",
              borderRadius: "10px",
              padding: "40px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "#fafafa",
              "&:hover": { backgroundColor: "#f0f0f0" },
            }}
            onClick={() => document.getElementById("fileUpload").click()}
          >
            <Typography variant="h6">
              Click or Drag & Drop Files Here
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supported formats: PDF, DOCX, XLSX
            </Typography>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx"
              style={{ display: "none" }}
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
                <Box
                  key={idx}
                  mt={2}
                  p={2}
                  border={1}
                  borderColor="grey.300"
                  borderRadius={4}
                  bgcolor="grey.50"
                >
                  <Typography variant="body2">{content}</Typography>
                </Box>
              ))}
            </Box>
          )}

          <FormControl fullWidth margin="normal">
            <InputLabel>Select Uploaded Documents</InputLabel>
            <Select multiple native onChange={handleDocumentSelection}>
              {uploadedDocuments.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.documentName}
                </option>
              ))}
            </Select>
          </FormControl>

          <Box mt={2} mb={4}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleDeleteDocuments}
            >
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
          <TextField
            label="Max Tokens"
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            margin="normal"
            variant="outlined"
            helperText="Recommended: 100"
          />

          <Box mt={4}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={
                loading ||
                (!documentContents.length && selectedDocumentIds.length === 0)
              }
              fullWidth
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : "Send to AI"}
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
              <Box
                mt={2}
                p={3}
                border={1}
                borderColor="grey.300"
                borderRadius={4}
                bgcolor="grey.100"
              >
                <ReactMarkdown>{response}</ReactMarkdown>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default App;
