// src/pages/admin/MasterDescriptionScreen.js
import React, { useState, useEffect, useRef } from 'react';
import AdminNavbar from '../../component/adminnavbar.js';
import {
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Grid,
  Avatar,
  CircularProgress,
  Tooltip,
  Stack,
  Pagination,
  Snackbar
} from '@mui/material';
import {
  Refresh,
  UploadFile,
  RuleFolder,
  Dataset,
  DeleteOutline,
  Warning,
  CheckCircle,
  Error
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import api from '../../services/api';

const PRIMARY = '#004F98';
const PER_PAGE = 8;

const MasterDescriptionScreen = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progressOpen, setProgressOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, file: null });
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [page, setPage] = useState(1);

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    setIsLoading(true);
    try {
      const result = await api.getUploadedFilesMetadata();
      const files = (result && result.data && Array.isArray(result.data)) ? result.data : [];
      setUploadedFiles(files);
    } catch (err) {
      console.error('Fetch uploaded files error', err);
      showSnackbar('Failed to load uploaded files', 'error');
      setUploadedFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar({ open: false, message: '', severity: 'success' }), 3500);
  };

  // ---------- Upload handling ----------
  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = null;
    if (file) await handleUploadFile(file);
  };

  const handleUploadFile = async (file) => {
    setUploadProgress(0);
    setProgressOpen(true);
    try {
      const filename = file.name;
      setUploadProgress(10);

      const arrayBuffer = await file.arrayBuffer();
      setUploadProgress(35);

      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      if (!workbook.SheetNames.length) throw new Error('Excel file contains no sheets');

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setUploadProgress(60);

      if (!rows || rows.length < 2) throw new Error('Excel must contain header row and at least one data row');

      const processed = processExcelData(rows);
      if (!processed.length) throw new Error('No valid data parsed from Excel');

      setUploadProgress(80);

      const resp = await api.uploadMasterDescriptions(processed, filename);
      setUploadProgress(95);

      if (!resp || !resp.success) throw new Error(resp?.message || 'Upload failed');

      showSnackbar(`Uploaded ${filename} — ${processed.length} records (inserted: ${resp.insertedCount || 0})`, 'success');
      await fetchUploadedFiles();
    } catch (err) {
      console.error('Upload error', err);
      showSnackbar(err.message || 'Upload failed', 'error');
    } finally {
      setProgressOpen(false);
      setUploadProgress(0);
    }
  };

  // drag & drop
  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;

    const onDragOver = (e) => {
      e.preventDefault();
      dropArea.style.background = 'rgba(0,0,0,0.03)';
    };
    const onDragLeave = (e) => {
      e.preventDefault();
      dropArea.style.background = 'transparent';
    };
    const onDrop = async (e) => {
      e.preventDefault();
      dropArea.style.background = 'transparent';
      const file = e.dataTransfer.files?.[0];
      if (file) await handleUploadFile(file);
    };

    dropArea.addEventListener('dragover', onDragOver);
    dropArea.addEventListener('dragleave', onDragLeave);
    dropArea.addEventListener('drop', onDrop);
    return () => {
      dropArea.removeEventListener('dragover', onDragOver);
      dropArea.removeEventListener('dragleave', onDragLeave);
      dropArea.removeEventListener('drop', onDrop);
    };
  }, [dropRef.current]);

  // ---------- Excel processing (kept from your function) ----------
  const processExcelData = (excelData) => {
    const headerRow = excelData[0];
    const dataRows = excelData.slice(1);
    const columnIndexMap = createColumnIndexMap(headerRow);

    if (!columnIndexMap.partNo && !columnIndexMap.description && !columnIndexMap.ndp && !columnIndexMap.mrp) {
      // Allow partial mapping but warn
      console.warn('Header mapping incomplete:', columnIndexMap);
    }

    const json = [];
    dataRows.forEach((row, idx) => {
      if (isRowEmpty(row)) return;
      const partNo = getCellValue(row, columnIndexMap.partNo);
      if (!partNo) return;
      const description = getCellValue(row, columnIndexMap.description);
      const ndp = getCellNumericValue(row, columnIndexMap.ndp);
      const mrp = getCellNumericValue(row, columnIndexMap.mrp);
      json.push({ partNo, description, ndp, mrp, itemType: null, division: null, sourceRow: idx + 2 });
    });
    return json;
  };

  const createColumnIndexMap = (headerRow) => {
    const columnIndexMap = {};
    const headerVariations = {
      partNo: ['part no#3', 'partno', 'part number', 'part_no', '000000000000002219', '000000000000002221'],
      description: ['material description', 'description', 'desc'],
      ndp: ['new ndp', 'ndp', 'net dealer price'],
      mrp: ['new mrp', 'mrp', 'max retail price'],
    };
    headerRow.forEach((cell, index) => {
      if (!cell) return;
      const txt = cell.toString().trim().toLowerCase();
      for (const [key, variants] of Object.entries(headerVariations)) {
        if (variants.includes(txt)) {
          columnIndexMap[key] = index;
          break;
        }
      }
    });
    return columnIndexMap;
  };
  const isRowEmpty = (row) => row.every(cell => cell == null || cell.toString().trim() === '');
  const getCellValue = (row, idx) => (idx == null || idx >= row.length || row[idx] == null) ? '' : row[idx].toString().trim();
  const getCellNumericValue = (row, idx) => {
    if (idx == null || idx >= row.length || row[idx] == null) return 0.0;
    const s = row[idx].toString().trim().replaceAll(',', '');
    return parseFloat(s) || 0.0;
  };

  // ---------- delete flow ----------



  const confirmDelete = async () => {
    const id = deleteDialog.file?._id;
    if (!id) return;
    try {
      const res = await api.deleteUploadedFile(id);
      if (res && res.success) {
        showSnackbar('File deleted', 'success');
        await fetchUploadedFiles();
      } else {
        showSnackbar(res?.message || 'Delete failed', 'error');
      }
    } catch (err) {
      console.error('delete error', err);
      showSnackbar('Delete failed', 'error');
    } finally {
      setDeleteDialog({ open: false, file: null });
    }
  };

  // ---------- pagination ----------
  const pageCount = Math.max(1, Math.ceil(uploadedFiles.length / PER_PAGE));
  const visibleFiles = uploadedFiles.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ---------- UI ----------
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <AdminNavbar handleRefresh={fetchUploadedFiles} />


      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Center wrapper: constrains page content to a comfortable width and centers it */}
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
          <Grid container spacing={3}>
            {/* Upload column */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: 2 }} elevation={3}>
                <Stack spacing={2} alignItems="center">
                  <Box
                    ref={dropRef}
                    sx={{
                      width: 140,
                      height: 140,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px dashed ${PRIMARY}33`,
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={openFilePicker}
                  >
                    <RuleFolder sx={{ fontSize: 56, color: PRIMARY }} />
                  </Box>

                  <Typography variant="h6" fontWeight={700} color={PRIMARY}>Upload Master Descriptions</Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Click the box or drop an Excel file (.xls/.xlsx) to convert and upload.
                  </Typography>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = null;
                      if (f) handleUploadFile(f);
                    }}
                  />

                  <Stack direction="row" spacing={2}>
                    <Button variant="contained" startIcon={<UploadFile />} onClick={openFilePicker} sx={{ backgroundColor: PRIMARY }}>
                      Upload Excel
                    </Button>
                    <Button variant="outlined" startIcon={<Refresh />} onClick={fetchUploadedFiles}>Refresh</Button>
                  </Stack>

                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">Supported:</Typography>
                    <Typography variant="caption" color="text.secondary">Flexible headers, commas allowed in numbers, automatic mapping</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Files list */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, borderRadius: 2 }} elevation={3}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Uploaded Files</Typography>

                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {uploadedFiles.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="h6" color="text.secondary">No uploads yet</Typography>
                        <Typography variant="body2" color="text.secondary">Use Upload Excel to add master descriptions</Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {visibleFiles.map(file => (
                          <Grid item xs={12} sm={6} key={file._id || file.filename}>
                            <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                              <Box sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `linear-gradient(135deg, ${PRIMARY}, #0066CC)`
                              }}>
                                <Dataset sx={{ color: 'white' }} />
                              </Box>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography noWrap fontWeight={700}>{file.filename || 'Untitled'}</Typography>
                                <Typography variant="caption" color="text.secondary">Records: {file.recordCount || 0} • Uploaded: {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : '—'}</Typography>
                              </Box>

                              <Box>
                                <Tooltip title="Delete file">
                                  <IconButton onClick={() => setDeleteDialog({ open: true, file })} aria-label={`delete-${file.filename}`}><DeleteOutline /></IconButton>
                                </Tooltip>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}

                    {uploadedFiles.length > PER_PAGE && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination count={pageCount} page={page} onChange={(e, v) => setPage(v)} color="primary" />
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>


      {/* progress dialog */}
      <Dialog open={progressOpen}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: PRIMARY }}><Dataset /></Avatar>
            <Box>
              <Typography variant="subtitle1">Processing upload</Typography>
              <Typography variant="caption" color="text.secondary">Converting Excel → JSON → uploading to server</Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ width: 420 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>{Math.round(uploadProgress)}%</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, file: null })}>
        <DialogTitle>Confirm delete</DialogTitle>
        <DialogContent>
          <Typography>Delete "{deleteDialog.file?.filename}" and its data?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, file: null })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* menu */}


      {/* hidden file input */}
      <input ref={fileInputRef} type="file" accept=".xls,.xlsx" style={{ display: 'none' }} onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = null;
        if (f) handleUploadFile(f);
      }} />

      {/* snackbar */}
      <Snackbar
        open={snackbar.open}
        message={<span>{snackbar.message}</span>}
        onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default MasterDescriptionScreen;
