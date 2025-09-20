import React, { useState, useCallback, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs'; // Ensure ExcelJS is imported
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Chip,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Breadcrumbs,
  Link,
  Avatar,
  Divider,
  Stack,
  useTheme,
  alpha,
  Tooltip,
  Fade,
  Zoom
} from '@mui/material';
import {
  UploadFile,
  Download,
  CompareArrows,
  Info,
  Delete,
  NavigateNext,
  Dashboard as DashboardIcon,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  TrendingUp,
  Description,
  Inventory,
  Assessment,
  CloudUpload,
  RestartAlt,
  SaveAlt
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../component/adminnavbar.js';

// Styled Components matching AdminDashboard
const ProfessionalCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid #E5E7EB',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  }
}));

const StatsCard = styled(ProfessionalCard)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 4,
    background: 'var(--accent-color)',
  }
}));

const UploadCard = styled(ProfessionalCard)(({ theme }) => ({
  position: 'relative',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  cursor: 'pointer',
  '&:hover': {
    '& .upload-icon': {
      transform: 'scale(1.1)',
    }
  }
}));

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #004F98 0%, #0066CC 100%)',
  color: 'white',
  padding: theme.spacing(6, 0),
  position: 'relative',
  overflow: 'hidden',
  marginBottom: theme.spacing(4),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  }
}));

const StyledDataGridRaw = styled(DataGrid)(({ theme }) => ({
  border: '1px solid #E5E7EB',
  
  // Column Headers
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#ffffff',
    color: '#004F98',
    borderBottom: '2px solid #004F98',
  },
  
  '& .MuiDataGrid-columnHeader': {
    backgroundColor: '#ffffff',
    color: '#004F98',
    borderRight: '1px solid #E5E7EB',
    '&:hover': {
      backgroundColor: '#F8FAFC',
    },
    '&:focus': {
      outline: 'none',
    },
  },
  
  // Column Header Title
  '& .MuiDataGrid-columnHeaderTitle': {
    color: '#004F98',
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.3px',
  },
  
  // Sort Icon
  '& .MuiDataGrid-sortIcon': {
    color: '#004F98',
    opacity: 0.7,
    '&.MuiDataGrid-sortIconActive': {
      opacity: 1,
      color: '#004F98',
    },
  },
  
  // Menu Icon
  '& .MuiDataGrid-menuIcon': {
    color: '#004F98',
  },
  
  // Column Separator
  '& .MuiDataGrid-columnSeparator': {
    color: '#E5E7EB',
    '&:hover': {
      color: '#004F98',
    },
  },
  
  // Data Cells
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#1F2937',
    '&:focus': {
      outline: 'none',
    },
    
    // Special styling for editable Phy Stock column
    '&[data-field="Phy Stock"]': {
      backgroundColor: '#F0F9FF',
      fontWeight: 600,
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#E0F2FE',
      },
    },
  },
  
  // Row styling
  '& .MuiDataGrid-row': {
    '&:hover': {
      backgroundColor: '#F8FAFC',
    },
    '&:nth-of-type(even)': {
      backgroundColor: '#FAFBFC',
    },
  },
  
  // Footer
  '& .MuiDataGrid-footerContainer': {
    borderTop: '2px solid #004F98',
    backgroundColor: '#ffffff',
    color: '#004F98',
  },
  
  // Pagination
  '& .MuiTablePagination-root': {
    color: '#004F98',
  },
  
  // Scrollbar
  '& .MuiDataGrid-virtualScroller': {
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#F1F5F9',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#CBD5E1',
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: '#94A3B8',
      },
    },
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: '10px 24px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  }
}));

// Convert your 2D array (with headers in row[0]) into DataGrid rows
const buildGridData = (data) => {
  if (!data || data.length < 2) return { rows: [], columns: [] };

  const headers = data[0];
  const rows = data.slice(1).map((row, index) => {
    let rowObj = { id: index + 1 };
    headers.forEach((header, colIndex) => {
      rowObj[header] = row[colIndex];
    });
    return rowObj;
  });

  const columns = headers.map((header) => ({
    field: header,
    headerName: header,
    flex: 1,
    editable: header === "Phy Stock",
  }));

  return { rows, columns };
};

const StockComparison = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const primaryColor = '#004F98';
  const secondaryColor = '#0066CC';
  
  // ... (All your existing state variables remain the same)
  const [dmsData, setDmsData] = useState(null);
  const [physicalData, setPhysicalData] = useState(null);
  const [beforeData, setBeforeData] = useState(null);
  const [afterData, setAfterData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dmsFileName, setDmsFileName] = useState('');
  const [physicalFileName, setPhysicalFileName] = useState('');
  const [beforeFileName, setBeforeFileName] = useState('');
  const [afterFileName, setAfterFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [originalReportData, setOriginalReportData] = useState(null);
  const [processedDmsMap, setProcessedDmsMap] = useState(null);
  const [processedPhysicalMap, setProcessedPhysicalMap] = useState(null);
  const [dmsInfoMap, setDmsInfoMap] = useState(null);
  const [initialDmsMapForReport, setInitialDmsMapForReport] = useState(null);
  const [tvsTemplateData, setTvsTemplateData] = useState(null);
  const [dealerId, setDealerId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [taxable, setTaxableId] = useState('');
  const [mismatchedEntries, setMismatchedEntries] = useState([]);
  const [unmatchedEntries, setUnmatchedEntries] = useState({
    mismatchedRack: [],
    emptyRack: [],
    partNotFound: []
  });
  const [incompleteParts, setIncompleteParts] = useState([]);
  const [tvsAfterFileName, setTvsAfterFileName] = useState('');
  const [tvsAfterData, setTvsAfterData] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const steps = ['Initial Report', 'Before Adjustment', 'After Adjustment'];
  const [dupStats, setDupStats] = useState(null);
  const tvsAfterInputRef = useRef(null);
  const [summaryHeader, setSummaryHeader] = useState('');
  const [tvsStockTotal, setTvsStockTotal] = useState(0);
  const [highestQtySubtractions, setHighestQtySubtractions] = useState(new Map());


  const handleFileUpload = (event, fileType) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');

    if (fileType === 'dms') {
      setDmsFileName(file.name);
    } else if (fileType === 'physical') {
      setPhysicalFileName(file.name);
    } else if (fileType === 'before') {
      setBeforeFileName(file.name);
    } else if (fileType === 'after') {
      setAfterFileName(file.name);
    } else if (fileType === 'tvsAfter') {
      setTvsAfterFileName(file.name);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      let jsonData;
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (fileType === 'dms') {
          setDmsData(jsonData);
        } else if (fileType === 'physical') {
          setPhysicalData(jsonData);
        } else if (fileType === 'before') {
          setBeforeData(jsonData);
        } else if (fileType === 'after') {
          setAfterData(jsonData);
        } else if (fileType === 'tvsAfter') {
          setTvsAfterData(jsonData);
        }
      } catch (err) {
        setError(`Error reading ${fileType} file: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const clearFile = (fileType) => {
    if (fileType === 'dms') {
      setDmsData(null);
      setDmsFileName('');
      resetAll();
    } else if (fileType === 'physical') {
      setPhysicalData(null);
      setPhysicalFileName('');
      resetAll();
    } else if (fileType === 'before') {
      setBeforeData(null);
      setBeforeFileName('');
      if (currentStep === 1) {
        generateInitialReport();
      }
    } else if (fileType === 'after') {
      setAfterData(null);
      setAfterFileName('');
      if (currentStep === 2) {
        if (beforeData) {
          applyBeforeFileAdjustment();
        } else {
          generateInitialReport();
        }
      }
    } else if (fileType === 'tvsAfter') {
      setTvsAfterData(null);
      setTvsAfterFileName('');
      setTvsTemplateData(null);
      // Clear all unmatched entries when TVS After file is cleared
      setUnmatchedEntries({ mismatchedRack: [], emptyRack: [], partNotFound: [] });
      setHighestQtySubtractions(new Map()); // Clear highestQtySubtractions
      if (tvsAfterInputRef?.current) tvsAfterInputRef.current.value = null;
    }
  };

  const findColumnIndex = (headers, possibleNames) => {
    if (!headers || headers.length === 0) return -1;
    for (let name of possibleNames) {
      const index = headers.findIndex(header =>
        header !== null && header !== undefined && String(header).toLowerCase().includes(name.toLowerCase())
      );
      if (index !== -1) return index;
    }
    return -1;
  };

  const generateInitialReport = () => {
    if (!dmsData || !physicalData) {
      setError('Please upload both DMS and Physical files first.');
      return;
    }

    setLoading(true);
    setError('');
    setBeforeData(null);
    setBeforeFileName('');
    setAfterData(null);
    setAfterFileName('');
    setCurrentStep(0);
    setTvsTemplateData(null);
    // Clear TVS-related unmatched and subtractions when generating initial report
    setUnmatchedEntries({ mismatchedRack: [], emptyRack: [], partNotFound: [] });
    setHighestQtySubtractions(new Map());


    setTimeout(() => {
      try {
        const dmsHeaders = dmsData[0] || [];
        const physicalHeaders = physicalData[0] || [];

        const findColumn = (headers, names) => {
          const index = findColumnIndex(headers, names);
          if (index === -1) {
            console.warn(`Could not find a column with names like: ${names.join(', ')}`);
          }
          return index;
        };

        const partNoDmsIndex = findColumn(dmsHeaders, ['part no', 'partno', 'part number', 'part code', 'item']);
        const qtyDmsIndex = findColumn(dmsHeaders, ['free qty', 'qty', 'quantity', 'balance']);
        const descDmsIndex = findColumn(dmsHeaders, ['description', 'material description', 'item description']);
        const ndpDmsIndex = findColumn(dmsHeaders, ['ndp', 'net dealer price', 'unit price']);

        const partNoPhysicalIndex = findColumn(physicalHeaders, ['part no', 'partno', 'part number', 'part code', 'item']);
        const qtyPhysicalIndex = findColumn(physicalHeaders, ['qty', 'quantity', 'stock', 'phy qty', 'count']);
        const ndpIndex = findColumn(physicalHeaders, ['ndp', 'net dealer price', 'unit price']);
        const mrpIndex = findColumn(physicalHeaders, ['mrp', 'max retail price', 'retail price']);
        const descIndex = findColumn(physicalHeaders, ['description', 'material description', 'item description']);
        const locationIndex = findColumn(physicalHeaders, ['location', 'bin', 'storage']);
        const rackIndex = findColumn(physicalHeaders, ['rack', 'shelf', 'row']);

        if (partNoDmsIndex === -1 || qtyDmsIndex === -1) {
          throw new Error('DMS file must contain Part Number and Stock/Quantity columns.');
        }
        if (partNoPhysicalIndex === -1 || qtyPhysicalIndex === -1) {
          throw new Error('Physical file must contain Part Number and Quantity columns.');
        }

        const dmsMap = new Map();
        const dmsInfo = new Map();
        const physicalMap = new Map();

        for (let i = 1; i < dmsData.length; i++) {
          const row = dmsData[i];
          if (!row || row[partNoDmsIndex] === undefined || row[partNoDmsIndex] === null) continue;
          const partNo = String(row[partNoDmsIndex]).trim().toUpperCase();
          const quantity = parseFloat(row[qtyDmsIndex]) || 0;
          if (partNo) {
            dmsMap.set(partNo, (dmsMap.get(partNo) || 0) + quantity);
            if (!dmsInfo.has(partNo)) {
              dmsInfo.set(partNo, {
                description: descDmsIndex !== -1 ? String(row[descDmsIndex] || '').trim() : '',
                ndp: ndpDmsIndex !== -1 ? parseFloat(row[ndpDmsIndex]) || 0 : 0
              });
            }
          }
        }

        for (let i = 1; i < physicalData.length; i++) {
          const row = physicalData[i];
          if (!row || row[partNoPhysicalIndex] === undefined || row[partNoPhysicalIndex] === null) continue;
          const partNo = String(row[partNoPhysicalIndex]).trim().toUpperCase();
          const quantity = parseFloat(row[qtyPhysicalIndex]) || 0;
          if (partNo) {
            const existing = physicalMap.get(partNo);
            if (existing) {
              existing.quantity += quantity;
            } else {
              physicalMap.set(partNo, {
                quantity: quantity,
                ndp: ndpIndex !== -1 ? parseFloat(row[ndpIndex]) || 0 : 0,
                mrp: mrpIndex !== -1 ? parseFloat(row[mrpIndex]) || 0 : 0,
                description: descIndex !== -1 ? String(row[descIndex] || '').trim() : '',
                location: locationIndex !== -1 ? String(row[locationIndex] || '').trim() : '',
                rack: rackIndex !== -1 ? String(row[rackIndex] || '').trim() : ''
              });
            }
          }
        }

        setProcessedDmsMap(new Map(dmsMap));
        setProcessedPhysicalMap(new Map(physicalMap));
        setDmsInfoMap(new Map(dmsInfo));
        setInitialDmsMapForReport(new Map(dmsMap));

        const report = generateReportFromMaps(dmsMap, physicalMap, dmsInfo, initialDmsMapForReport || dmsMap);
        setReportData(report);

        const dmsPartNosRaw = dmsData.slice(1)
          .map(r => r[partNoDmsIndex])
          .filter(p => p !== undefined && p !== null && String(p).trim() !== '')
          .map(p => String(p).trim().toUpperCase());

        const physPartNosRaw = physicalData.slice(1)
          .map(r => r[partNoPhysicalIndex])
          .filter(p => p !== undefined && p !== null && String(p).trim() !== '')
          .map(p => String(p).trim().toUpperCase());

        const dmsDupCount = dmsPartNosRaw.length;
        const physDupCount = physPartNosRaw.length;

        const dmsSet = new Set(dmsPartNosRaw);
        const physSet = new Set(physPartNosRaw);

        const physOnlyDupCount = physPartNosRaw.filter(p => !dmsSet.has(p)).length;
        const physOnlyUniqueCount = [...physSet].filter(p => !dmsSet.has(p)).length;
        const physUniqueCount = physSet.size;

        setDupStats({
          dmsDupCount,
          physDupCount,
          physOnlyDupCount,
          physOnlyUniqueCount,
          physUniqueCount
        });

      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const StyledDataGrid = styled(DataGrid)(({ theme }) => ({ // Original StyledDataGrid is now `StyledDataGridRaw`
  border: '1px solid #E5E7EB',
  
  // Column Headers
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#ffffff',
    color: '#004F98',
    borderBottom: '2px solid #004F98',
  },
  
  '& .MuiDataGrid-columnHeader': {
    backgroundColor: '#ffffff',
    color: '#004F98',
    borderRight: '1px solid #E5E7EB',
    '&:hover': {
      backgroundColor: '#F8FAFC',
    },
    '&:focus': {
      outline: 'none',
    },
  },
  
  // Column Header Title
  '& .MuiDataGrid-columnHeaderTitle': {
    color: '#004F98',
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.3px',
  },
  
  // Sort Icon
  '& .MuiDataGrid-sortIcon': {
    color: '#004F98',
    opacity: 0.7,
    '&.MuiDataGrid-sortIconActive': {
      opacity: 1,
      color: '#004F98',
    },
  },
  
  // Menu Icon
  '& .MuiDataGrid-menuIcon': {
    color: '#004F98',
  },
  
  // Column Separator
  '& .MuiDataGrid-columnSeparator': {
    color: '#E5E7EB',
    '&:hover': {
      color: '#004F98',
    },
  },
  
  // Data Cells
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#1F2937',
    '&:focus': {
      outline: 'none',
    },
    
    // Special styling for editable Phy Stock column
    '&[data-field="Phy Stock"]': {
      backgroundColor: '#F0F9FF',
      fontWeight: 600,
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#E0F2FE',
      },
    },
  },
  
  // Row styling
  '& .MuiDataGrid-row': {
    '&:hover': {
      backgroundColor: '#F8FAFC',
    },
    '&:nth-of-type(even)': {
      backgroundColor: '#FAFBFC',
    },
  },
  
  // Footer
  '& .MuiDataGrid-footerContainer': {
    borderTop: '2px solid #004F98',
    backgroundColor: '#ffffff',
    color: '#004F98',
  },
  
  // Pagination
  '& .MuiTablePagination-root': {
    color: '#004F98',
  },
  
  // Scrollbar
  '& .MuiDataGrid-virtualScroller': {
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#F1F5F9',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#CBD5E1',
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: '#94A3B8',
      },
    },
  },
}));

  const generateReportFromMaps = (currentDmsMap, currentPhysicalMap, dmsInfoMap, initialDmsMap) => {
    const report = [];
    const headers = [
      'SI no', 'PartNo', 'Part Description',
      'DMS Stk', 'Phy Stock', 'Short', 'Excess',
      'NDP', 'MRP',
      'Shortage Value', 'Excess Value',
      'Total NDP Value', 'Total MRP Value',
      'Before NDP'
    ];
    report.push(headers);

    const detailedRows = [];
    const allPartNumbers = new Set([...currentPhysicalMap.keys(), ...currentDmsMap.keys(), ...dmsInfoMap.keys()]);

    let totalDms = 0, totalPhysical = 0, totalShort = 0, totalExcess = 0,
      totalShortageValue = 0, totalExcessValue = 0,
      totalPhysicalNdpValue = 0, totalPhysicalMrpValue = 0,
       totalOriginalDmsValue = 0;

    for (const partNo of allPartNumbers) {
      const physicalInfo = currentPhysicalMap.get(partNo);
      const dmsPartInfo = dmsInfoMap.get(partNo);

      const dmsQty = currentDmsMap.get(partNo) || 0;
      const physicalQty = physicalInfo ? physicalInfo.quantity : 0;

      const description = (physicalInfo ? physicalInfo.description : '') || (dmsPartInfo ? dmsPartInfo.description : '');
      const ndp = (physicalInfo ? physicalInfo.ndp : 0) || (dmsPartInfo ? dmsPartInfo.ndp : 0);
      const mrp = physicalInfo ? physicalInfo.mrp : 0;

      const short = Math.max(0, dmsQty - physicalQty);
      const excess = Math.max(0, physicalQty - dmsQty);

      const shortageValue = short * ndp;
      const excessValue = excess * ndp;

      const totalPhysicalNdp = physicalQty * ndp;
      const totalPhysicalMrp = physicalQty * mrp;

      const originalDmsValue = dmsQty * ndp;

      totalDms += dmsQty;
      totalPhysical += physicalQty;
      totalShort += short;
      totalExcess += excess;
      totalShortageValue += shortageValue;
      totalExcessValue += excessValue;
      totalPhysicalNdpValue += totalPhysicalNdp;
      totalPhysicalMrpValue += totalPhysicalMrp;
      
      totalOriginalDmsValue += originalDmsValue;

      detailedRows.push([
        0, partNo, description,
        dmsQty, physicalQty, short, excess,
        ndp, mrp,
        shortageValue, excessValue,
        totalPhysicalNdp, totalPhysicalMrp,
         originalDmsValue
      ]);
    }

    detailedRows.forEach((row, i) => row[0] = i + 1);

    report.push([
      '', '', 'TOTAL',
      totalDms, totalPhysical, totalShort, totalExcess,
      '', '',
      totalShortageValue, totalExcessValue,
      totalPhysicalNdpValue, totalPhysicalMrpValue,
       totalOriginalDmsValue
    ]);
    report.push(...detailedRows);

    return report;
  };

  const applyBeforeFileAdjustment = () => {
    if (!beforeData || !processedDmsMap || !processedPhysicalMap || !dmsInfoMap || !initialDmsMapForReport) {
      setError('Please upload a Before file or generate an initial report first.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      try {
        const beforeHeaders = beforeData[0] || [];
        const partNoBeforeIndex = findColumnIndex(beforeHeaders, ['part no', 'partno', 'part number', 'part code', 'item']);
        const qtyBeforeIndex = findColumnIndex(beforeHeaders, ['qty', 'quantity', 'stock', 'phy qty', 'count']);

        if (partNoBeforeIndex === -1 || qtyBeforeIndex === -1) {
          throw new Error('Before file must contain Part Number and Quantity columns.');
        }

        const beforeMap = new Map();
        let totalBeforeFileQty = 0;

        for (let i = 1; i < beforeData.length; i++) {
          const row = beforeData[i];
          if (!row || row.length <= Math.max(partNoBeforeIndex, qtyBeforeIndex)) {
            continue;
          }

          const partNoValue = row[partNoBeforeIndex];
          const qtyValue = row[qtyBeforeIndex];

          if (partNoValue === undefined || partNoValue === null) continue;

          const partNo = String(partNoValue).trim().toUpperCase();
          let quantity = 0;

          if (qtyValue !== undefined && qtyValue !== null) {
            if (typeof qtyValue === 'number') quantity = qtyValue;
            else if (typeof qtyValue === 'string') {
              const trimmedValue = qtyValue.trim();
              const directParse = parseFloat(trimmedValue);
              if (!isNaN(directParse)) quantity = directParse;
              else {
                const matches = trimmedValue.match(/(\d+\.?\d*)/);
                if (matches && matches[1]) quantity = parseFloat(matches[1]);
              }
            }
          }

          if (qtyValue === true) quantity = 1;

          if (partNo && quantity > 0) {
            beforeMap.set(partNo, (beforeMap.get(partNo) || 0) + quantity);
            totalBeforeFileQty += quantity;
          }
        }

        if (beforeMap.size === 0 && totalBeforeFileQty === 0) {
          throw new Error('No valid data found in the Before file. Please check that the file contains part numbers and positive quantities.');
        }

        const adjustedDmsMap = new Map(processedDmsMap);

        for (const [partNo, beforeQty] of beforeMap) {
          const existsInInitialDms = initialDmsMapForReport.has(partNo);
          if (!existsInInitialDms) continue;

          const dmsBefore = adjustedDmsMap.get(partNo) || 0;
          const dmsAfter = Math.max(0, dmsBefore - beforeQty);
          adjustedDmsMap.set(partNo, dmsAfter);
        }

        setProcessedDmsMap(adjustedDmsMap);

        const report = generateReportFromMaps(adjustedDmsMap, processedPhysicalMap, dmsInfoMap, initialDmsMapForReport);
        setReportData(report);
        setCurrentStep(1);

        setError(`Before File applied. DMS stock reduced where matched.`);
      } catch (err) {
        setError(`Error applying Before file: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  const applyAfterFileAdjustment = () => {
    if (!afterData || !processedDmsMap || !physicalData || !dmsInfoMap || !initialDmsMapForReport) {
      setError('Please upload an After file and ensure an initial report is generated.');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      try {
        const afterHeaders = afterData[0] || [];
        const partNoAfterIndex = findColumnIndex(afterHeaders, ['PartNo', 'part no', 'part', 'code', 'item']);
        const qtyAfterIndex = findColumnIndex(afterHeaders, ['qty', 'quantity', 'phy qty', 'stock', 'count']);

        if (partNoAfterIndex === -1 || qtyAfterIndex === -1) {
          throw new Error('After file must contain Part Number and Quantity columns.');
        }

        const afterSubtractionsMap = new Map();
        for (let i = 1; i < afterData.length; i++) {
          const row = afterData[i];
          if (!row || row[partNoAfterIndex] === undefined) continue;
          const partNo = String(row[partNoAfterIndex]).trim().toUpperCase();
          const quantity = parseFloat(row[qtyAfterIndex]) || 0;
          if (partNo && quantity > 0) {
            afterSubtractionsMap.set(partNo, (afterSubtractionsMap.get(partNo) || 0) + quantity);
          }
        }

        const adjustedDmsMap = new Map(processedDmsMap);
        for (const [partNo, quantity] of afterSubtractionsMap.entries()) {
          if (adjustedDmsMap.has(partNo)) {
            const dmsBefore = adjustedDmsMap.get(partNo) || 0;
            adjustedDmsMap.set(partNo, Math.max(0, dmsBefore - quantity));
          }
        }

        const adjustedPhysicalMap = new Map(processedPhysicalMap);
        const unmatchedAfterRows = [];
        for (const [partNo, quantity] of afterSubtractionsMap.entries()) {
          if (adjustedPhysicalMap.has(partNo)) {
            const physicalInfo = adjustedPhysicalMap.get(partNo);
            physicalInfo.quantity = Math.max(0, physicalInfo.quantity - quantity);
          } else {
            unmatchedAfterRows.push({ partNo: partNo, rack: '', quantity: quantity });
          }
        }

        setProcessedDmsMap(adjustedDmsMap);
        setProcessedPhysicalMap(adjustedPhysicalMap);

        const report = generateReportFromMaps(adjustedDmsMap, adjustedPhysicalMap, dmsInfoMap, initialDmsMapForReport);
        setReportData(report);
        setCurrentStep(2);

        let successMessage = `After File adjustments applied successfully.`;
        if (unmatchedAfterRows.length > 0) {
          successMessage += ` ${unmatchedAfterRows.length} part numbers from the After file did not match any physical stock.`;
        }
        setError(successMessage);

      } catch (err) {
        setError(`Error applying After file: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }, 100);
  };

// Helper function for report styling (reused from your downloadExcel)
// Helper function for report styling (reused from your downloadExcel)
const applyReportStyling = (worksheet, reportData, reportHeadersStartRow = 1) => {
  /*console.log('=== DEBUGGING REPORT STYLING ===');
  console.log('reportHeadersStartRow:', reportHeadersStartRow);
  console.log('worksheet.rowCount:', worksheet.rowCount);*/
  
  // Calculate actual row positions
  const actualHeaderRow = reportHeadersStartRow;
  const actualTotalRow = reportHeadersStartRow + 1;
  const actualDataStartRow = reportHeadersStartRow + 2;

 // console.log(`Header row: ${actualHeaderRow}, Total row: ${actualTotalRow}, Data starts: ${actualDataStartRow}`);

  // First, let's see what's actually in the worksheet
  //console.log('=== WORKSHEET CONTENT DEBUG ===');
  for (let r = 1; r <= Math.min(worksheet.rowCount, 5); r++) {
    const row = worksheet.getRow(r);
    const rowValues = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowValues.push(`Col${colNumber}: "${cell.value}"`);
    });
    //console.log(`Row ${r}:`, rowValues);
  }

  // Debug the header row specifically
  //console.log('=== HEADER ROW DEBUG ===');
  const headerRow = worksheet.getRow(actualHeaderRow);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers.push({ col: colNumber, value: cell.value, type: typeof cell.value });
  });
  //console.log('Headers found:', headers);

  // Now apply styling
  headerRow.height = 30;
  
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const headerValue = cell.value ? String(cell.value).trim() : '';
    //nsole.log(`Styling header column ${colNumber}: "${headerValue}"`);

    // Base header style
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF004F98' }
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true,
      size: 12
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
    };

    // Apply specific colors - more flexible matching
    if (headerValue.toLowerCase().includes('short')) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
      //console.log(`✓ Applied RED to column ${colNumber} (${headerValue})`);
    } else if (headerValue.toLowerCase().includes('excess')) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
      //console.log(`✓ Applied ORANGE to column ${colNumber} (${headerValue})`);
    } else if (headerValue.toLowerCase().includes('phy') && headerValue.toLowerCase().includes('stock')) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      //console.log(`✓ Applied GREEN to column ${colNumber} (${headerValue})`);
    } else if (headerValue.toLowerCase().includes('value') || 
               headerValue.toLowerCase().includes('ndp') || 
               headerValue.toLowerCase().includes('mrp')) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
     // console.log(`✓ Applied PURPLE to column ${colNumber} (${headerValue})`);
    } else {
      //console.log(`○ No special color for column ${colNumber} (${headerValue})`);
    }
  });

  // Style the TOTAL row
  const totalRow = worksheet.getRow(actualTotalRow);
  totalRow.height = 25;
  totalRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    cell.font = { bold: true, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    };
    if (typeof cell.value === 'number') {
      cell.numFmt = '#,##0.00';
      cell.alignment.horizontal = 'right';
    }
  });

  // Style data rows
  for (let i = actualDataStartRow; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    row.height = 20;
    
    // Alternating row colors
    const isEvenRow = (i - actualDataStartRow) % 2 === 0;
    
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      // Alternating background
      if (isEvenRow) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }

      // Borders
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };

      // Default font and alignment
      cell.font = { size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };

      // Get corresponding header
      const headerCell = worksheet.getRow(actualHeaderRow).getCell(colNumber);
      const header = headerCell.value ? String(headerCell.value).trim() : '';

      // Special formatting based on column
      if (header.toLowerCase().includes('phy') && header.toLowerCase().includes('stock')) {
        if (!isEvenRow) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
        }
        cell.font = { bold: true, size: 11 };
      }

      // Color text for Short/Excess values > 0
      if (typeof cell.value === 'number' && cell.value > 0) {
        if (header.toLowerCase().includes('short')) {
          cell.font = { color: { argb: 'FFDC2626' }, bold: true, size: 11 };
        } else if (header.toLowerCase().includes('excess')) {
          cell.font = { color: { argb: 'FFF59E0B' }, bold: true, size: 11 };
        }
      }

      // Number formatting
      if (typeof cell.value === 'number') {
        if (header.toLowerCase().includes('si no') || header.toLowerCase().includes('sl no')) {
          cell.numFmt = '0';
          cell.alignment.horizontal = 'center';
        } else if (header.toLowerCase().includes('value') || 
                   header.toLowerCase().includes('ndp') || 
                   header.toLowerCase().includes('mrp') ||
                   header.toLowerCase().includes('stock') ||
                   header.toLowerCase().includes('short') ||
                   header.toLowerCase().includes('excess')) {
          cell.numFmt = '#,##0.00';
          cell.alignment.horizontal = 'right';
        }
      }
    });
  }

  // Apply column widths
  const columnWidths = [8, 15, 30, 12, 12, 10, 10, 12, 12, 15, 15, 18, 18, 15];
  
  /*console.log('=== APPLYING COLUMN WIDTHS ===');*/
  columnWidths.forEach((width, index) => {
    const colNumber = index + 1;
    const column = worksheet.getColumn(colNumber);
    if (column) {
      column.width = width;
      /*console.log(`Set column ${colNumber} width to ${width}`);*/
    }
  });

  /*console.log('=== END DEBUGGING ===');*/
};


  // Helper function for summary styling
  const applySummaryStyling = (worksheet, summaryHeaderTitle) => {
    // Main header (e.g., "Summary" or custom header)
    const mainHeaderRow = worksheet.getRow(1);
    mainHeaderRow.height = 30;
    mainHeaderRow.getCell(1).value = summaryHeaderTitle || 'Summary Report';
    mainHeaderRow.getCell(1).font = { bold: true, size: 16, color: { argb: 'FF004F98' } };
    mainHeaderRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('A1:D1'); // Assuming 4 columns for summary as per buildSummaryAoA

    // Empty row for spacing
    worksheet.getRow(2).height = 10;

    // Data rows from row 3 onwards
    for (let i = 3; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      row.height = 25; // Standard height for summary rows
      
      row.eachCell((cell, colNumber) => {
        cell.font = { size: 11 };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };

        // Style for descriptive text (column A and C)
        if (colNumber === 1 || colNumber === 3) {
          cell.font.bold = true;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F7' } }; // Light greyish background
          cell.alignment.horizontal = 'left';
        } 
        // Style for values (column B and D)
        else if (colNumber === 2 || colNumber === 4) {
          cell.alignment.horizontal = 'right';
          if (typeof cell.value === 'number') {
            // Apply Rupee format for Value/NDP/MRP
            const associatedHeader = worksheet.getRow(i).getCell(colNumber === 2 ? 1 : 3).value;
            if (associatedHeader && /Value|NDP|MRP/i.test(String(associatedHeader))) {
              cell.numFmt = '₹ #,##0.00'; // Rupee format
            } else {
              cell.numFmt = '#,##0'; // Integer format for counts
            }
            cell.font.bold = true;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }; // Light blue background
          }
        }
      });
    }

    // Column widths (as defined in buildSummaryAoA)
    worksheet.columns = [
        { width: 36 }, // Col 1: Description
        { width: 18 }, // Col 2: Value/Count
        { width: 36 }, // Col 3: Description
        { width: 22 }  // Col 4: Value/Count
    ];
  };

  // Helper function for TVS template styling
  const applyTvsTemplateStyling = (worksheet) => {
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow background
      cell.font = { color: { argb: 'FFFF0000' }, bold: true, size: 12 }; // Red text
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // Data rows
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      row.height = 20;
      // Alternating row colors
      if ((i - 2) % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        });
      }
      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        // Apply number format to STOCK (column I or index 8) and COST (column G or index 6), MRP (column J or index 9)
        if (colNumber === 7 || colNumber === 9 || colNumber === 10) { // COST, STOCK, MRP
            cell.numFmt = '#,##0.00';
            cell.alignment.horizontal = 'right';
        }
      });
    }

    // Set column widths for TVS Template
    worksheet.columns = [
      { width: 15 }, // DEALER_ID
      { width: 15 }, // BRANCH_ID
      { width: 20 }, // SPARE_PART_NO
      { width: 20 }, // MANUFACTURER_ID
      { width: 15 }, // LOCATION_ID
      { width: 15 }, // RACK
      { width: 12 }, // COST
      { width: 10 }, // TAXABLE
      { width: 12 }, // STOCK
      { width: 12 }  // MRP
    ];
  };

  // Helper function for raw data styling (DMS, Physical, Before, After)
  const applyRawDataStyling = (worksheet, headerColor = 'FF004F98') => {
    const headerRow = worksheet.getRow(1);
    if (headerRow.values.length > 0) { // Only apply if there's a header
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
            };
        });
    }

    // Data rows
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      // Alternating row colors
      if ((i - 2) % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        });
      }
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        // Auto-detect number formatting (simple attempt)
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0.00'; // Default to 2 decimal places for numbers
          cell.alignment.horizontal = 'right';
        }
      });
    }

    // Auto-fit columns based on content
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 0;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2; // Min width 10, plus some padding
    });
  };


 const downloadExcel = async () => {
  if (!reportData) return;

  try {
    console.log('=== DOWNLOAD EXCEL DEBUG ===');
    console.log('reportData length:', reportData.length);
    console.log('reportData[0] (headers):', reportData[0]);
    console.log('reportData[1] (totals):', reportData[1]);

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Comparison Report');

    // Add data to worksheet
    console.log('Adding rows to worksheet...');
    reportData.forEach((row, index) => {
      worksheet.addRow(row);
      console.log(`Added row ${index + 1}:`, row);
      if (index >= 2) return; // Only log first few rows
    });

    console.log('Worksheet row count after adding data:', worksheet.rowCount);

    // Apply styling
    console.log('Applying styling...');
    applyReportStyling(worksheet, reportData, 1);

    // Generate filename
    const date = new Date();
    const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;

    let fileName = 'Stock_Comparison_Report';
    if (currentStep === 1) fileName += '_with_Before_Adjustment';
    if (currentStep === 2) fileName += '_with_Before_and_After_Adjustments';

    // Save the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_${timestamp}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    console.log('Excel file downloaded successfully');

  } catch (err) {
    console.error('Error in downloadExcel:', err);
    setError(`Error downloading report: ${err.message}`);
  }
};


  const formatNumber = (num) => {
    if (typeof num !== 'number' || isNaN(num)) return num;
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const resetAll = () => {
    setDmsData(null);
    setPhysicalData(null);
    setBeforeData(null);
    setAfterData(null);
    setReportData(null);
    setOriginalReportData(null);
    setDmsFileName('');
    setPhysicalFileName('');
    setBeforeFileName('');
    setAfterFileName('');
    setCurrentStep(0);
    setProcessedDmsMap(null);
    setProcessedPhysicalMap(null);
    setDmsInfoMap(null);
    setInitialDmsMapForReport(null);
    setTvsTemplateData(null);
    setDealerId('');
    setBranchId('');
    setManufacturerId('');
    setTaxableId(''); // Corrected from duplicate setBranchId
    setError('');
    setUnmatchedEntries({ mismatchedRack: [], emptyRack: [], partNotFound: [] }); // Reset unmatched entries
    setHighestQtySubtractions(new Map()); // Reset highestQtySubtractions
  };

  const handleTvsStockEdit = (partNo, rack, newQuantity, rowIndex) => {
    if (tvsTemplateData && rowIndex >= 1 && rowIndex < tvsTemplateData.length) {
      const updatedTvsData = [...tvsTemplateData];
      updatedTvsData[rowIndex][8] = Math.max(0, newQuantity);

      let newTotalStock = 0;
      for (let i = 1; i < updatedTvsData.length; i++) {
        newTotalStock += parseFloat(updatedTvsData[i][8]) || 0;
      }

      setTvsTemplateData(updatedTvsData);
      setTvsStockTotal(newTotalStock);

      const updatedPhysicalMap = new Map(processedPhysicalMap);
      if (updatedPhysicalMap.has(partNo)) {
        const data = updatedPhysicalMap.get(partNo);

        let totalForPart = 0;
        for (let i = 1; i < updatedTvsData.length; i++) {
          if (updatedTvsData[i][2] === partNo) {
            totalForPart += parseFloat(updatedTvsData[i][8]) || 0;
          }
        }

        data.quantity = totalForPart;
        updatedPhysicalMap.set(partNo, data);
        setProcessedPhysicalMap(updatedPhysicalMap);

        const freshReport = generateReportFromMaps(
          processedDmsMap,
          updatedPhysicalMap,
          dmsInfoMap,
          initialDmsMapForReport,
        );
        setReportData(freshReport);
      }
    }
  };

 

  // MODIFIED generateTvsTemplate FUNCTION - wrapped in useCallback
  const generateTvsTemplate = useCallback(() => {
    if (!physicalData) {
        setError('Please upload the physical stock file first.');
        return;
    }

    try {
        const physicalHeaders = physicalData[0] || [];
        const findColumn = (headers, names) => findColumnIndex(headers, names);

        const partNoIndex = findColumn(physicalHeaders, ['part no', 'partno']);
        const qtyIndex = findColumn(physicalHeaders, ['qty', 'quantity']);
        const ndpIndex = findColumn(physicalHeaders, ['ndp']);
        const mrpIndex = findColumn(physicalHeaders, ['mrp']);
        const locationIndex = findColumn(physicalHeaders, ['location']);
        const rackIndex = findColumn(physicalHeaders, ['rack']);

        if (partNoIndex === -1 || qtyIndex === -1) {
            throw new Error('Physical file must contain Part Number and Quantity columns.');
        }

        const physicalDataMap = new Map(); // Used for tvsAfterData matching
        const physicalPartMap = new Map(); // Used for tvsAfterData matching

        // Map to aggregate physical stock by PartNo and Rack, preventing duplicates
        const aggregatedPhysicalStock = new Map(); // Key: `${partNo}|${rack}`, Value: { partNo, rack, quantity, ndp, mrp, location }

        for (let i = 1; i < physicalData.length; i++) {
            const row = physicalData[i];
            if (!row || !row[partNoIndex]) continue;

            const partNo = String(row[partNoIndex]).trim().toUpperCase();
            const rack = rackIndex !== -1 ? String(row[rackIndex] || '').trim() : '';
            const currentQty = parseFloat(row[qtyIndex]) || 0;
            const ndp = ndpIndex !== -1 ? parseFloat(row[ndpIndex]) || 0 : 0;
            const mrp = mrpIndex !== -1 ? parseFloat(row[mrpIndex]) || 0 : 0;
            const location = locationIndex !== -1 ? String(row[locationIndex] || '').trim() : '';

            const key = `${partNo}|${rack}`;

            // Populate maps for tvsAfterData matching
            if (partNo && rack) {
                physicalDataMap.set(key, true);
            }
            if (!physicalPartMap.has(partNo)) {
                physicalPartMap.set(partNo, []);
            }
            // Ensure unique racks are added to physicalPartMap
            if (!physicalPartMap.get(partNo).includes(rack)) {
                physicalPartMap.get(partNo).push(rack);
            }

            // Aggregate quantities for the same Part No and Rack
            if (aggregatedPhysicalStock.has(key)) {
                const existingEntry = aggregatedPhysicalStock.get(key);
                existingEntry.quantity += currentQty;
                // For NDP, MRP, Location, we assume they are consistent for a given PartNo/Rack.
                // If they could differ, you'd need a rule (e.g., take the last one, average, etc.).
                aggregatedPhysicalStock.set(key, existingEntry);
            } else {
                aggregatedPhysicalStock.set(key, {
                    partNo: partNo,
                    rack: rack,
                    quantity: currentQty,
                    ndp: ndp,
                    mrp: mrp,
                    location: location,
                });
            }
        }

        const perfectMatchSubtractions = new Map(); // Renamed from 'subtractions'
        // This `currentUnmatched` will be used to update the state `unmatchedEntries`
        // It captures entries that are unmatched *after* perfect match processing,
        // and before user-applied `highestQtySubtractions` are considered in this run.
        const currentUnmatched = { mismatchedRack: [], emptyRack: [], partNotFound: [] };

        if (tvsAfterData) {
            const afterHeaders = tvsAfterData[0] || [];
            const partNoAfterIndex = findColumn(afterHeaders, ['PartNo', 'part no']);
            const qtyAfterIndex = findColumn(afterHeaders, ['qty', 'quantity']);
            const rackAfterIndex = findColumn(afterHeaders, ['rack']);

            if (partNoAfterIndex !== -1 && qtyAfterIndex !== -1) {
                for (let i = 1; i < tvsAfterData.length; i++) {
                    const afterRow = tvsAfterData[i];
                    if (!afterRow || !afterRow[partNoAfterIndex]) continue;

                    const afterPartNo = String(afterRow[partNoAfterIndex]).trim().toUpperCase();
                    const afterQty = parseFloat(afterRow[qtyAfterIndex]) || 0;
                    const afterRack = rackAfterIndex !== -1 ? String(afterRow[rackAfterIndex] || '').trim() : '';
                    const perfectMatchKey = `${afterPartNo}|${afterRack}`;

                    if (afterRack && physicalDataMap.has(perfectMatchKey)) {
                        perfectMatchSubtractions.set(perfectMatchKey, (perfectMatchSubtractions.get(perfectMatchKey) || 0) + afterQty);
                    } else {
                        // These are the *initially* unmatched entries that will be shown
                        // and potentially resolved by the `applyUnmatchedQuantities` function.
                        if (!afterRack) {
                            currentUnmatched.emptyRack.push({ partNo: afterPartNo, quantity: afterQty });
                        } else if (physicalPartMap.has(afterPartNo)) {
                            currentUnmatched.mismatchedRack.push({
                                partNo: afterPartNo,
                                wrongRack: afterRack,
                                quantity: afterQty,
                                availableRacks: physicalPartMap.get(afterPartNo).join(', ')
                            });
                        } else {
                            currentUnmatched.partNotFound.push({ partNo: afterPartNo, rack: afterRack, quantity: afterQty });
                        }
                    }
                }
            }
        }

        // --- Combine all types of subtractions before applying ---
        const combinedSubtractions = new Map(perfectMatchSubtractions); // Start with perfect matches

        // Add subtractions from the 'highest quantity rack' logic (from state)
        for (const [key, qty] of highestQtySubtractions.entries()) {
            combinedSubtractions.set(key, (combinedSubtractions.get(key) || 0) + qty);
        }

        // Update the unmatched entries state.
        // Note: If `applyUnmatchedQuantities` was just run, it would have already cleared
        // `mismatchedRack` and `emptyRack` in `unmatchedEntries`, so this `setUnmatchedEntries`
        // will now reflect the *remaining* unmatched entries (e.g., partNotFound) or
        // the state from the *first* generation before any 'apply' action.
        setUnmatchedEntries(currentUnmatched);

        // Apply combined subtractions to the aggregated physical stock
        aggregatedPhysicalStock.forEach((entry, key) => {
            if (combinedSubtractions.has(key)) {
                entry.quantity = Math.max(0, entry.quantity - combinedSubtractions.get(key));
            }
        });

        const tvsHeaders = ['DEALER_ID', 'BRANCH_ID', 'SPARE_PART_NO', 'MANUFACTURER_ID', 'LOCATION_ID', 'RACK', 'COST', 'TAXABLE', 'STOCK', 'MRP'];
        const tvsRows = [tvsHeaders];
        let totalStock = 0;

        // Finally, generate the TVS rows from the aggregated and subtracted data
        aggregatedPhysicalStock.forEach(entry => {
            // Only add rows for parts with positive stock after all subtractions
            if (entry.quantity > 0) {
                tvsRows.push([
                    dealerId || '',
                    branchId || '',
                    entry.partNo,
                    manufacturerId || '',
                    entry.location,
                    entry.rack,
                    entry.ndp,
                    taxable || 'Y',
                    entry.quantity,
                    entry.mrp
                ]);
                totalStock += entry.quantity;
            }
        });

        setTvsTemplateData(tvsRows);
        setTvsStockTotal(totalStock);

        let successMessage = 'TVS template generated.';
        if (perfectMatchSubtractions.size > 0) {
            successMessage += ' Subtractions from perfect Part No and Rack matches applied.';
        }
        if (highestQtySubtractions.size > 0) { // Check if highestQtySubtractions were involved
            successMessage += ' Additional subtractions for previously unmatched entries applied to highest stock racks.';
            setHighestQtySubtractions(new Map()); // Reset highestQtySubtractions after successful application
        }
        if (currentUnmatched.mismatchedRack.length > 0 || currentUnmatched.emptyRack.length > 0 || currentUnmatched.partNotFound.length > 0) {
            successMessage += ' Please review the remaining unmatched entries below.';
        }
        setError(successMessage); // Reusing setError for success messages for simplicity

    } catch (err) {
        setError(`Error generating TVS template: ${err.message}`);
        setUnmatchedEntries({ mismatchedRack: [], emptyRack: [], partNotFound: [] });
        setHighestQtySubtractions(new Map()); // Clear additional subtractions on error
    }
  }, [physicalData, tvsAfterData, dealerId, branchId, manufacturerId, taxable, findColumnIndex, setError, setTvsTemplateData, setTvsStockTotal, setUnmatchedEntries, highestQtySubtractions, setHighestQtySubtractions]);

 // NEW FUNCTION: To handle applying unmatched quantities to highest stock racks
const applyUnmatchedQuantities = useCallback((currentUnmatchedEntries) => {
    console.log('\n🔍 DEBUG: Input unmatched entries:');
    console.log('emptyRack entries:', currentUnmatchedEntries.emptyRack);
    console.log('mismatchedRack entries:', currentUnmatchedEntries.mismatchedRack);
    
    // Check if M1010200 is in the entries
    const m1010200EmptyRack = currentUnmatchedEntries.emptyRack.find(entry => entry.partNo === 'M1010200');
    const m1010200MismatchedRack = currentUnmatchedEntries.mismatchedRack.find(entry => entry.partNo === 'M1010200');
    
    console.log('M1010200 in emptyRack?', m1010200EmptyRack);
    console.log('M1010200 in mismatchedRack?', m1010200MismatchedRack);

    if (currentUnmatchedEntries.mismatchedRack.length === 0 && currentUnmatchedEntries.emptyRack.length === 0) {
        setError("No unmatched entries (mismatched rack or empty rack) to apply.");
        return;
    }

    if (!window.confirm("Do you want to apply these unmatched quantities to the highest stock racks for each part number? This will recalculate the TVS template.")) {
        return;
    }

    try {
        const newHighestQtySubtractions = new Map();
        const problemParts = [];
        const physicalHeaders = physicalData[0] || [];
        const partNoIndex = findColumnIndex(physicalHeaders, ['part no', 'partno']);
        const qtyIndex = findColumnIndex(physicalHeaders, ['qty', 'quantity']);
        const rackIndex = findColumnIndex(physicalHeaders, ['rack']);

        if (partNoIndex === -1 || qtyIndex === -1) {
            throw new Error('Physical file must contain Part Number and Quantity columns to apply unmatched quantities.');
        }

        // Recalculate initial aggregated physical stock
        const initialAggregatedPhysicalStock = new Map();
        for (let i = 1; i < physicalData.length; i++) {
            const row = physicalData[i];
            if (!row || !row[partNoIndex]) continue;

            const partNo = String(row[partNoIndex]).trim().toUpperCase();
            const rack = rackIndex !== -1 ? String(row[rackIndex] || '').trim() : '';
            const currentQty = parseFloat(row[qtyIndex]) || 0;
            const key = `${partNo}|${rack}`;

            if (initialAggregatedPhysicalStock.has(key)) {
                initialAggregatedPhysicalStock.get(key).quantity += currentQty;
            } else {
                initialAggregatedPhysicalStock.set(key, { partNo, rack, quantity: currentQty });
            }
        }

        // TRACK RUNNING SUBTRACTIONS TO AVOID OVER-SUBTRACTION
        const runningSubtractions = new Map();
        console.log('\n🏃‍♂️ Initializing running subtractions tracker...');

        // ENHANCED: findOptimalSubtraction function with running subtraction awareness
        const findOptimalSubtraction = (targetPartNo, requestedQty, entryIndex = 0) => {
            console.log(`\n=== Processing ${targetPartNo}, requested: ${requestedQty} (Entry #${entryIndex + 1}) ===`);
            
            // Get all racks for this part
            const partRacks = Array.from(initialAggregatedPhysicalStock.values())
                .filter(entry => entry.partNo === targetPartNo);

            console.log('Original part racks found:', partRacks);

            if (partRacks.length === 0) {
                console.log(`❌ No racks found for ${targetPartNo}`);
                return {
                    subtractions: new Map(),
                    totalAvailable: 0,
                    remainingQty: requestedQty,
                    problem: `Part ${targetPartNo} not found in physical stock`,
                    actualSubtracted: 0
                };
            }

            // CALCULATE AVAILABLE STOCK AFTER CONSIDERING RUNNING SUBTRACTIONS
            const partRacksWithRunningSubtractions = partRacks.map(rack => {
                const key = `${targetPartNo}|${rack.rack}`;
                const alreadyPlannedSubtraction = runningSubtractions.get(key) || 0;
                const availableAfterPlanned = Math.max(0, rack.quantity - alreadyPlannedSubtraction);
                
                console.log(`  Rack ${rack.rack}: original=${rack.quantity}, already_planned=${alreadyPlannedSubtraction}, available=${availableAfterPlanned}`);
                
                return {
                    ...rack,
                    availableQuantity: availableAfterPlanned,
                    originalQuantity: rack.quantity
                };
            }).sort((a, b) => b.availableQuantity - a.availableQuantity); // Sort by available quantity (highest first)

            const totalAvailable = partRacksWithRunningSubtractions.reduce((sum, rack) => sum + rack.availableQuantity, 0);
            const totalOriginal = partRacksWithRunningSubtractions.reduce((sum, rack) => sum + rack.originalQuantity, 0);
            
            console.log(`  Total original stock: ${totalOriginal}`);
            console.log(`  Total available (after planned subtractions): ${totalAvailable}`);
            
            if (totalAvailable === 0) {
                console.log(`❌ No stock available for ${targetPartNo} after considering planned subtractions`);
                return {
                    subtractions: new Map(),
                    totalAvailable: totalOriginal,
                    remainingQty: requestedQty,
                    problem: `Part ${targetPartNo} - no stock available after considering previous subtractions in this batch`,
                    actualSubtracted: 0
                };
            }

            const highestAvailableRack = partRacksWithRunningSubtractions[0];
            const subtractions = new Map();
            
            console.log(`  Highest available rack: ${highestAvailableRack.rack} with ${highestAvailableRack.availableQuantity} available`);

            if (requestedQty <= highestAvailableRack.availableQuantity) {
                // Can be fully subtracted from highest available rack
                console.log(`  ✅ Can fully subtract ${requestedQty} from ${highestAvailableRack.rack}`);
                subtractions.set(`${targetPartNo}|${highestAvailableRack.rack}`, requestedQty);
                
                // UPDATE RUNNING SUBTRACTIONS
                const key = `${targetPartNo}|${highestAvailableRack.rack}`;
                const newRunningTotal = (runningSubtractions.get(key) || 0) + requestedQty;
                runningSubtractions.set(key, newRunningTotal);
                console.log(`  📝 Updated running subtraction for ${key}: ${newRunningTotal}`);
                
                return {
                    subtractions,
                    totalAvailable: totalOriginal,
                    remainingQty: 0,
                    problem: null,
                    actualSubtracted: requestedQty
                };
            } else {
                // Cannot be fully subtracted from highest available rack
                console.log(`  ⚠️ Cannot fully subtract ${requestedQty} from ${highestAvailableRack.rack} (only ${highestAvailableRack.availableQuantity} available)`);
                
                const actualSubtractedFromHighest = highestAvailableRack.availableQuantity;
                const remainingAfterHighest = requestedQty - actualSubtractedFromHighest;
                
                console.log(`  📊 Will subtract ${actualSubtractedFromHighest} from ${highestAvailableRack.rack}, remaining needed: ${remainingAfterHighest}`);
                
                // Apply subtraction to highest available rack
                if (actualSubtractedFromHighest > 0) {
                    subtractions.set(`${targetPartNo}|${highestAvailableRack.rack}`, actualSubtractedFromHighest);
                    
                    // UPDATE RUNNING SUBTRACTIONS  
                    const key = `${targetPartNo}|${highestAvailableRack.rack}`;
                    const newRunningTotal = (runningSubtractions.get(key) || 0) + actualSubtractedFromHighest;
                    runningSubtractions.set(key, newRunningTotal);
                    console.log(`  📝 Updated running subtraction for ${key}: ${newRunningTotal}`);
                }
                
                // Analyze remaining racks for the leftover quantity
                const remainingRacks = partRacksWithRunningSubtractions.slice(1).filter(r => r.availableQuantity > 0);
                console.log(`  📋 Remaining racks with availability:`, remainingRacks.map(r => `${r.rack}(${r.availableQuantity})`));
                
                if (remainingRacks.length === 0) {
                    console.log(`  ❌ No other racks available for remaining ${remainingAfterHighest}`);
                    return {
                        subtractions,
                        totalAvailable: totalOriginal,
                        remainingQty: remainingAfterHighest,
                        problem: `After subtracting ${actualSubtractedFromHighest} from ${highestAvailableRack.rack}, remaining ${remainingAfterHighest} units cannot be allocated. No other racks available.`,
                        actualSubtracted: actualSubtractedFromHighest
                    };
                }
                
                // Check if there are multiple racks with the same highest available quantity
                const highestRemainingQty = remainingRacks[0].availableQuantity;
                const racksWithHighestRemainingQty = remainingRacks.filter(r => r.availableQuantity === highestRemainingQty);
                
                console.log(`  📊 Highest remaining available quantity: ${highestRemainingQty}`);
                console.log(`  📊 Racks with highest remaining quantity:`, racksWithHighestRemainingQty.map(r => `${r.rack}(${r.availableQuantity})`));
                
                const totalRemainingAvailable = remainingRacks.reduce((sum, r) => sum + r.availableQuantity, 0);
                
                if (remainingAfterHighest > totalRemainingAvailable) {
                    // Not enough stock even across all remaining racks
                    console.log(`  ❌ Insufficient total remaining stock: need ${remainingAfterHighest}, have ${totalRemainingAvailable}`);
                    return {
                        subtractions,
                        totalAvailable: totalOriginal,
                        remainingQty: remainingAfterHighest - totalRemainingAvailable,
                        problem: `After subtracting ${actualSubtractedFromHighest} from ${highestAvailableRack.rack}, insufficient stock for remaining ${remainingAfterHighest} units. Only ${totalRemainingAvailable} available in other racks.`,
                        actualSubtracted: actualSubtractedFromHighest
                    };
                } else if (racksWithHighestRemainingQty.length > 1 && remainingAfterHighest <= highestRemainingQty) {
                    // Multiple racks have same available quantity and could accommodate the remaining - AMBIGUOUS
                    console.log(`  ⚠️ AMBIGUOUS: Multiple racks with same available quantity can handle remaining ${remainingAfterHighest}`);
                    const rackOptions = racksWithHighestRemainingQty.map(r => `${r.rack}(${r.availableQuantity})`).join(', ');
                    return {
                        subtractions,
                        totalAvailable: totalOriginal,
                        remainingQty: remainingAfterHighest,
                        problem: `After subtracting ${actualSubtractedFromHighest} from ${highestAvailableRack.rack}, remaining ${remainingAfterHighest} units cannot be allocated. Multiple racks have same available quantity: ${rackOptions}`,
                        actualSubtracted: actualSubtractedFromHighest
                    };
                } else {
                    // Can be handled by next best rack but current logic doesn't auto-distribute
                    console.log(`  ⚠️ Could be allocated to ${remainingRacks[0].rack} but current logic doesn't auto-distribute`);
                    return {
                        subtractions,
                        totalAvailable: totalOriginal,
                        remainingQty: remainingAfterHighest,
                        problem: `After subtracting ${actualSubtractedFromHighest} from ${highestAvailableRack.rack}, remaining ${remainingAfterHighest} units could go to ${remainingRacks[0].rack}(${remainingRacks[0].availableQuantity}) but current logic doesn't auto-distribute`,
                        actualSubtracted: actualSubtractedFromHighest
                    };
                }
            }
        };

        // Process emptyRack entries WITH RUNNING SUBTRACTION TRACKING
        console.log('\n🔄 Processing emptyRack entries with running subtraction awareness...');
        currentUnmatchedEntries.emptyRack.forEach((entry, index) => {
            console.log(`\n🔄 Processing emptyRack entry ${index + 1}: ${entry.partNo}, qty: ${entry.quantity}`);
            const result = findOptimalSubtraction(entry.partNo, entry.quantity, index);
            
            // Apply the subtractions to the final map
            result.subtractions.forEach((qty, key) => {
                newHighestQtySubtractions.set(key, (newHighestQtySubtractions.get(key) || 0) + qty);
                console.log(`  ✅ Added subtraction to final map: ${key} -> +${qty} (total: ${newHighestQtySubtractions.get(key)})`);
            });
            
            // Track problems
            if (result.problem || result.remainingQty > 0) {
                console.log(`  ❌ Problem detected for ${entry.partNo}:`, result.problem);
                problemParts.push({
                    partNo: entry.partNo,
                    requestedQty: entry.quantity,
                    actualSubtracted: result.actualSubtracted || 0,
                    remainingQty: result.remainingQty || 0,
                    totalAvailable: result.totalAvailable,
                    issue: result.problem || `Could not subtract remaining ${result.remainingQty} units`,
                    type: 'emptyRack',
                    entryNumber: index + 1
                });
            }
        });

        // Process mismatchedRack entries WITH RUNNING SUBTRACTION TRACKING
        console.log('\n🔄 Processing mismatchedRack entries with running subtraction awareness...');
        currentUnmatchedEntries.mismatchedRack.forEach((entry, index) => {
            console.log(`\n🔄 Processing mismatchedRack entry ${index + 1}: ${entry.partNo}, qty: ${entry.quantity}`);
            const result = findOptimalSubtraction(entry.partNo, entry.quantity, index + currentUnmatchedEntries.emptyRack.length);
            
            // Apply the subtractions to the final map
            result.subtractions.forEach((qty, key) => {
                newHighestQtySubtractions.set(key, (newHighestQtySubtractions.get(key) || 0) + qty);
                console.log(`  ✅ Added subtraction to final map: ${key} -> +${qty} (total: ${newHighestQtySubtractions.get(key)})`);
            });
            
            // Track problems
            if (result.problem || result.remainingQty > 0) {
                console.log(`  ❌ Problem detected for ${entry.partNo}:`, result.problem);
                problemParts.push({
                    partNo: entry.partNo,
                    requestedQty: entry.quantity,
                    actualSubtracted: result.actualSubtracted || 0,
                    remainingQty: result.remainingQty || 0,
                    totalAvailable: result.totalAvailable,
                    issue: result.problem || `Could not subtract remaining ${result.remainingQty} units`,
                    type: 'mismatchedRack',
                    originalRack: entry.wrongRack,
                    entryNumber: index + 1
                });
            }
        });

        console.log('\n📊 Final running subtractions map:', Array.from(runningSubtractions.entries()));
        console.log('📊 Final newHighestQtySubtractions map:', Array.from(newHighestQtySubtractions.entries()));
        console.log('📊 Final problem parts:', problemParts);
        
        setHighestQtySubtractions(newHighestQtySubtractions);
        setUnmatchedEntries(prev => ({
            ...prev,
            mismatchedRack: [],
            emptyRack: []
        }));

        if (problemParts.length > 0) {
            setIncompleteParts(problemParts);
        }

        generateTvsTemplate();

        let successMessage = "Unmatched quantities processed and TVS template re-generated.";
        if (problemParts.length > 0) {
            successMessage += ` WARNING: ${problemParts.length} entries had incomplete or ambiguous subtractions. Please review below.`;
        }
        setError(successMessage);

    } catch (err) {
        setError(`Error applying unmatched quantities: ${err.message}`);
        setHighestQtySubtractions(new Map());
    }
}, [physicalData, findColumnIndex, setHighestQtySubtractions, setUnmatchedEntries, generateTvsTemplate, setError]);


  const clearTvsTemplate = () => {
    setDealerId('');
    setBranchId('');
    setManufacturerId('');
    setTaxableId('');
    clearFile('tvsAfter');
    setTvsStockTotal(0);
    setUnmatchedEntries({ mismatchedRack: [], emptyRack: [], partNotFound: [] });
    setHighestQtySubtractions(new Map()); // Clear highestQtySubtractions
    setError('');
    if (tvsAfterInputRef.current) tvsAfterInputRef.current.value = null;
  };

  const downloadTvsTemplate = () => {
    if (!tvsTemplateData) return;

    try {
      // Use ExcelJS for consistent styling logic
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('TVS Template');
      worksheet.addRows(tvsTemplateData);
      applyTvsTemplateStyling(worksheet); // Apply TVS specific styling

      const date = new Date();
      const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;

      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `TVS_Template_${timestamp}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      });
      
    } catch (err) {
      setError(`Error downloading TVS template: ${err.message}`);
    }
  };

  const buildSummary = (reportData, dupStats) => {
    if (!reportData || !dupStats) return null;

    const tot = reportData[1];

    const summary = {
      partBeforeDup: dupStats.dmsDupCount,
      partAfterDup: dupStats.dmsDupCount + dupStats.physOnlyUniqueCount,
      shortageCount: reportData.slice(2).filter(r => r[5] > 0).length,
      excessCount: reportData.slice(2).filter(r => r[6] > 0).length,
      shortageValue: tot[9],
      excessValue: tot[10],
      ndpBefore: tot[13],
      ndpAfter: tot[11],
      mrpAfter: tot[12],
      lineItemsDup: dupStats.physDupCount,
      lineItemsUnique: dupStats.physUniqueCount,
      extrasUnique: dupStats.physOnlyUniqueCount
    };

    return summary;
  };

  const summary = React.useMemo(
    () => buildSummary(reportData, dupStats),
    [reportData, dupStats, forceUpdate]
  );

  const buildSummaryAoA = (s, title, reportData) => {
    if (!s) return null;
    const tot = reportData?.[1] || [];
    const mrpAfter = Number(tot[12] || 0);

    const rows = [
      [title || 'Summary', '', '', ''], // Main title row
      [], // Empty row for spacing
      ['Count of Part No. before audit', s.partBeforeDup, 'Count of Part No. after audit', s.partAfterDup],
      ['Count of Shortage Parts', s.shortageCount, 'Value of Shortage Parts', Number(s.shortageValue || 0)],
      ['Count of Excess Parts', s.excessCount, 'Value of Excess Parts', Number(s.excessValue || 0)],
      ['Total NDP Value before audit', Number(s.ndpBefore || 0),
'Total NDP Value after audit', Number(s.ndpAfter || 0)],
      ['No of Line item counted', s.lineItemsDup, 'Count of Extras found during audit', s.extrasUnique],
      ['No of Line item counted - Unique', s.lineItemsUnique, 'Total MRP Value after audit', mrpAfter]
    ];
    return rows;
  };

  const downloadSummaryExcel = () => {
    if (!summary) {
      setError('No summary to download.');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Summary');

      const rows = buildSummaryAoA(summary, summaryHeader || 'Summary', reportData);
      worksheet.addRows(rows);

      applySummaryStyling(worksheet, summaryHeader); // Apply summary specific styling

      const dt = new Date();
      const ts = `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}_${String(dt.getHours()).padStart(2, '0')}${String(dt.getMinutes()).padStart(2, '0')}`;
      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Summary_${ts}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
      });
    } catch (err) {
      setError(`Error downloading summary: ${err.message}`);
    }
  };

  const downloadAllExcel = async () => {
    if (!reportData) {
      setError('Please generate the report first.');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const date = new Date();
      const timestamp = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
      const toSafeFileName = (s) =>
        (s && s.trim() ? s.trim() : 'Summary')
          .replace(/[\\/:*?"<>|]/g, '_')
          .replace(/\s+/g, ' ')
          .slice(0, 150);
      const baseFileName = toSafeFileName(summaryHeader || 'Audit_Report');

      // 1. Stock Comparison Report
      let reportDataForSheet = reportData;
      if (summaryHeader?.trim()) {
        reportDataForSheet = [[summaryHeader.trim()], [], ...reportData];
      }
      const wsReport = workbook.addWorksheet('Stock Comparison');
      wsReport.addRows(reportDataForSheet);

      // Merge header if summaryHeader is present
      if (summaryHeader?.trim()) {
        const lastCol = (reportData[0]?.length || 1) - 1;
        wsReport.mergeCells(1, 1, 1, lastCol + 1); // Row 1, Col 1 to Row 1, Last_Column
        // Style the merged header for the report
        wsReport.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF004F98' } };
        wsReport.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
        wsReport.getRow(1).height = 30; // Set height for the main title row
        wsReport.getRow(2).height = 10; // Spacing row
        applyReportStyling(wsReport, reportData, 3); // Adjust dataStartRow for styling
      } else {
        applyReportStyling(wsReport, reportData);
      }


      // 2. Summary Report
      if (summary) {
        const wsSum = workbook.addWorksheet('Summary');
        const summaryRows = buildSummaryAoA(summary, summaryHeader || 'Summary', reportData);
        wsSum.addRows(summaryRows);
        applySummaryStyling(wsSum, summaryHeader);
      }

      // 3. TVS Template
      if (tvsTemplateData && tvsTemplateData.length > 0) {
        const wsTvs = workbook.addWorksheet('TVS Template');
        wsTvs.addRows(tvsTemplateData);
        applyTvsTemplateStyling(wsTvs);
      }

      // 4. Raw Data Sheets (DMS, Physical, Before, After)
      const addRawExcelSheet = (data, name, headerColor = 'FF004F98') => {
        if (!data || !data.length) return;
        const ws = workbook.addWorksheet(name.slice(0, 31)); // Sheet name max 31 chars
        ws.addRows(data);
        applyRawDataStyling(ws, headerColor);
      };

      addRawExcelSheet(dmsData, 'Raw DMS', 'FF004F98'); // Primary Blue for DMS
      addRawExcelSheet(physicalData, 'Raw Physical', 'FF10B981'); // Green for Physical
      addRawExcelSheet(beforeData, 'Raw Before', 'FFF59E0B'); // Orange for Before
      addRawExcelSheet(afterData, 'Raw After', 'FFDC2626'); // Red for After

      // Save the combined file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseFileName}_${timestamp}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(`Error building and downloading all files: ${err.message}`);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Navigation Bar */}
      <AdminNavbar />

      {/* Hero Section */}
      <HeroSection>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' }
            }}>
              Stock Comparison Report Generator
            </Typography>
            <Typography variant="h6" sx={{ 
              mb: 3, 
              opacity: 0.9,
              fontWeight: 400,
              maxWidth: 800,
              mx: 'auto'
            }}>
              Generate comprehensive stock comparison reports with advanced analysis and adjustments
            </Typography>
            
            {/* Breadcrumbs */}
            <Breadcrumbs 
              sx={{ 
                justifyContent: 'center',
                display: 'flex',
                '& .MuiBreadcrumbs-ol': { justifyContent: 'center' },
                color: 'rgba(255, 255, 255, 0.8)',
                '& .MuiBreadcrumbs-separator': { color: 'rgba(255, 255, 255, 0.6)' }
              }}
            >
              <Link
                underline="hover"
                color="inherit"
                href="/admin"
                onClick={(e) => { e.preventDefault(); navigate('/admin'); }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Dashboard
              </Link>
              <Typography color="text.primary" sx={{ color: 'white' }}>
                Stock Comparison
              </Typography>
            </Breadcrumbs>
          </Box>
        </Container>
      </HeroSection>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Main Content */}
        {reportData ? (
          <>
            {/* Stepper */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
              <Stepper activeStep={currentStep} alternativeLabel>
                {steps.map((label, index) => (
                  <Step key={label}>
                    <StepLabel 
                      StepIconProps={{
                        sx: {
                          '&.Mui-active': { color: primaryColor },
                          '&.Mui-completed': { color: '#10B981' }
                        }
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>

            {/* Adjustment Controls */}
            {currentStep < 2 && (
              <ProfessionalCard sx={{ mb: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(primaryColor, 0.1), 
                      color: primaryColor,
                      mr: 2
                    }}>
                      <CloudUpload />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {currentStep === 0 ? 'Optional: Apply "Before" Adjustments' : 'Optional: Apply "After" Adjustments'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentStep === 0 ?
                          'Upload a Before file to adjust DMS stock quantities (reduces DMS stock only)' :
                          'Upload an After file to adjust both DMS and Physical stock quantities'
                        }
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ActionButton 
                          variant="outlined" 
                          component="label"
                          startIcon={<CloudUpload />}
                          sx={{ borderColor: primaryColor, color: primaryColor }}
                        >
                          {currentStep === 0 ? 'Select Before File' : 'Select After File'}
                          <input
                            type="file"
                            hidden
                            accept=".xlsx, .xls"
                            onChange={(e) => handleFileUpload(e, currentStep === 0 ? 'before' : 'after')}
                          />
                        </ActionButton>
                        {currentStep === 0 ? (
                          beforeFileName && (
                            <Chip 
                              label={beforeFileName} 
                              variant="outlined" 
                              onDelete={() => clearFile('before')}
                              sx={{ maxWidth: 300 }}
                            />
                          )
                        ) : (
                          afterFileName && (
                            <Chip 
                              label={afterFileName} 
                              variant="outlined" 
                              onDelete={() => clearFile('after')}
                              sx={{ maxWidth: 300 }}
                            />
                          )
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <ActionButton
                        variant="contained"
                        onClick={currentStep === 0 ? applyBeforeFileAdjustment : applyAfterFileAdjustment}
                        disabled={currentStep === 0 ? !beforeData : !afterData}
                        startIcon={<NavigateNext />}
                        sx={{ 
                          backgroundColor: primaryColor,
                          '&:hover': { backgroundColor: secondaryColor }
                        }}
                      >
                        {loading ? 'Applying...' : `Apply ${currentStep === 0 ? 'Before' : 'After'} Adjustment`}
                      </ActionButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </ProfessionalCard>
            )}
          </>
        ) : (
          <>
            {/* Instructions Card */}
            <ProfessionalCard sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#004F98', 0.1), 
                    color: '#004F98',
                    mr: 2
                  }}>
                    <Info />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                      Instructions for Stock Comparison
                    </Typography>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Step 1" size="small" sx={{ mr: 2, bgcolor: primaryColor, color: 'white' }} />
                        <Typography variant="body2">
                          Upload DMS and Physical files, then generate the initial report
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Step 2" size="small" sx={{ mr: 2 }} />
                        <Typography variant="body2">
                          (Optional) Upload a Before file to adjust DMS stock quantities
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip label="Step 3" size="small" sx={{ mr: 2 }} />
                        <Typography variant="body2">
                          (Optional) Upload an After file to adjust both DMS and Physical stock
                        </Typography>
                      </Box>
                    </Stack>
                    <Alert severity="info" sx={{ mt: 3 }}>
                      Each step builds on the previous one, allowing you to see the impact of each adjustment.
                    </Alert>
                  </Box>
                </Box>
              </CardContent>
            </ProfessionalCard>

            {/* File Upload Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Zoom in timeout={300}>
                  <UploadCard>
                    {dmsData && (
                      <IconButton
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                        onClick={() => clearFile('dms')}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    )}
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Avatar sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: alpha(primaryColor, 0.1),
                        color: primaryColor,
                        mx: 'auto',
                        mb: 3
                      }}>
                        <Inventory sx={{ fontSize: 40 }} className="upload-icon" />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        DMS File
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Upload your DMS stock data file
                      </Typography>
                      <ActionButton
                        variant="contained"
                        component="label"
                        startIcon={<CloudUpload />}
                        sx={{ 
                          backgroundColor: primaryColor,
                          '&:hover': { backgroundColor: secondaryColor }
                        }}
                      >
                        Select DMS File
                        <input
                          type="file"
                          hidden
                          accept=".xlsx, .xls"
                          onChange={(e) => handleFileUpload(e, 'dms')}
                        />
                      </ActionButton>
                      {dmsFileName && (
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            label={dmsFileName}
                            color="primary"
                            variant="outlined"
                            sx={{ maxWidth: '100%' }}
                            onDelete={() => clearFile('dms')}
                          />
                        </Box>
                      )}
                      <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                        Must contain: Part Numbers and <strong>Total Stock</strong>
                      </Typography>
                    </CardContent>
                  </UploadCard>
                </Zoom>
              </Grid>

              <Grid item xs={12} md={6}>
                <Zoom in timeout={600}>
                  <UploadCard>
                    {physicalData && (
                      <IconButton
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                        onClick={() => clearFile('physical')}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    )}
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Avatar sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: alpha('#10B981', 0.1),
                        color: '#10B981',
                        mx: 'auto',
                        mb: 3
                      }}>
                        <Assessment sx={{ fontSize: 40 }} className="upload-icon" />
                      </Avatar>
                      <Typography variant="h6" gutterBottom>
                        Physical Stock File
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Upload your physical stock count file
                      </Typography>
                      <ActionButton
                        variant="contained"
                        component="label"
                        startIcon={<CloudUpload />}
                        sx={{ 
                          backgroundColor: '#10B981',
                          '&:hover': { backgroundColor: '#059669' }
                        }}
                      >
                        Select Physical File
                        <input
                          type="file"
                          hidden
                          accept=".xlsx, .xls"
                          onChange={(e) => handleFileUpload(e, 'physical')}
                        />
                      </ActionButton>
                      {physicalFileName && (
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            label={physicalFileName}
                            color="success"
                            variant="outlined"
                            sx={{ maxWidth: '100%' }}
                            onDelete={() => clearFile('physical')}
                          />
                        </Box>
                      )}
                      <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                        Must contain: Part Numbers, Quantities, NDP, and MRP
                      </Typography>
                    </CardContent>
                  </UploadCard>
                </Zoom>
              </Grid>
            </Grid>

            {/* Generate Report Button */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <ActionButton
                variant="contained"
                size="large"
                onClick={generateInitialReport}
                disabled={!dmsData || !physicalData || loading}
                startIcon={<CompareArrows />}
                sx={{
                  backgroundColor: '#F59E0B',
                  px: 6,
                  py: 2,
                  fontSize: '1.1rem',
                  '&:hover': { backgroundColor: '#D97706' },
                  '&:disabled': { backgroundColor: '#E5E7EB' }
                }}
              >
                {loading ? 'Generating Report...' : 'Generate Initial Report'}
              </ActionButton>
            </Box>
          </>
        )}

        {/* Loading Progress */}
        {loading && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
          </Box>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Fade in>
            <Alert 
              severity={error.includes('Error') ? 'error' : 'success'} 
              sx={{ mb: 3 }}
              onClose={() => setError('')}
              icon={error.includes('Error') ? <ErrorIcon /> : <CheckCircle />}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Report Display Section */}
        {reportData && (
          <Box>
            {/* Report Header */}
            <Paper elevation={0} sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              backgroundColor: alpha(primaryColor, 0.04),
              border: `1px solid ${alpha(primaryColor, 0.1)}`
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ color: primaryColor, fontWeight: 700 }}>
                    Stock Comparison Report
                    {currentStep === 1 && ' (with Before Adjustment)'}
                    {currentStep === 2 && ' (with Before & After Adjustments)'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Found {reportData.length - 2} part records • Generated on {new Date().toLocaleString()}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                  <ActionButton
                    variant="contained"
                    onClick={downloadExcel}
                    startIcon={<SaveAlt />}
                    sx={{ 
                      backgroundColor: '#8B5CF6',
                      '&:hover': { backgroundColor: '#7C3AED' }
                    }}
                  >
                    Download Report
                  </ActionButton>
                  <ActionButton
                    variant="outlined"
                    onClick={resetAll}
                    startIcon={<RestartAlt />}
                    sx={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    New Comparison
                  </ActionButton>
                </Stack>
              </Box>
            </Paper>

            {/* Data Grid */}
            <Paper elevation={0} sx={{ height: 600, mb: 4, borderRadius: 2 }}>
              <StyledDataGrid
                {...buildGridData(reportData)}
                density="compact"
                experimentalFeatures={{ newEditingApi: true }}
                processRowUpdate={(newRow, oldRow) => {
                  if (newRow['Phy Stock'] !== oldRow['Phy Stock']) {
                    // Handle stock update if needed
                  }
                  return newRow;
                }}
                onProcessRowUpdateError={(err) => console.error(err)}
              />
            </Paper>

            {/* Total Summary Bar */}
            <Paper elevation={0} sx={{ 
              mb: 4, 
              overflow: 'hidden',
              borderRadius: 2,
              border: `2px solid ${primaryColor}`
            }}>
              <Box sx={{ display: 'flex', backgroundColor: primaryColor, color: 'white', p: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Report Totals
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {reportData[1].map((cell, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      flex: '1 1 auto',
                      minWidth: 120,
                      p: 2,
                      backgroundColor: idx % 2 === 0 ? '#F8FAFC' : 'white',
                      borderRight: '1px solid #E5E7EB',
                      textAlign: typeof cell === 'number' ? 'right' : 'left',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      {reportData[0][idx]}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {typeof cell === 'number' ? formatNumber(cell) : cell}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Enhanced Summary Section */}
         {summary && (
  <Box>
    {/* Summary Header and Controls */}
    <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Summary Heading (Dealer/Showroom Name)"
            placeholder="e.g., 11030-TRIJAL MOTORS - RAMAGONDANAHALLI"
            value={summaryHeader}
            onChange={(e) => setSummaryHeader(e.target.value)}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1 }}>
                  <Description color="action" />
                </Box>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
            <ActionButton
              variant="contained"
              startIcon={<SaveAlt />}
              onClick={downloadSummaryExcel}
              disabled={!summary}
              sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#059669' } }}
            >
              Download Summary
            </ActionButton>
            <ActionButton
              variant="contained"
              color="secondary"
              startIcon={<Download />}
              onClick={downloadAllExcel}
              disabled={!reportData}
            >
              Download All
            </ActionButton>
          </Stack>
        </Grid>
      </Grid>

      {summaryHeader && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            backgroundColor: primaryColor,
            color: '#fff',
            p: 2,
            textAlign: 'center',
            fontWeight: 'bold',
            borderRadius: 2
          }}
        >
          {summaryHeader}
        </Paper>
      )}
    </Paper>

    {/* Summary Statistics Grid */}
    <Grid container spacing={3}>
      {/* Part Count Statistics */}
      <Grid item xs={12} md={6}>
        <StatsCard sx={{ '--accent-color': primaryColor }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Part Numbers Before Audit
                </Typography>
                <Typography variant="h3" sx={{ color: primaryColor, fontWeight: 700 }}>
                  {summary?.partBeforeDup?.toLocaleString() || '0'}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha(primaryColor, 0.1), color: primaryColor }}>
                <Inventory />
              </Avatar>
            </Box>
          </CardContent>
        </StatsCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <StatsCard sx={{ '--accent-color': '#10B981' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Part Numbers After Audit
                </Typography>
                <Typography variant="h3" sx={{ color: '#10B981', fontWeight: 700 }}>
                  {summary?.partAfterDup?.toLocaleString() || '0'}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: alpha('#10B981', 0.1), color: '#10B981' }}>
                <CheckCircle />
              </Avatar>
            </Box>
          </CardContent>
        </StatsCard>
      </Grid>

      {/* Shortage Statistics */}
      <Grid item xs={12} md={6}>
        <StatsCard sx={{ '--accent-color': '#EF4444' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Shortage Parts
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Count</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {summary?.shortageCount?.toLocaleString() || '0'}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Value</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#EF4444' }}>
                  ₹ {summary?.shortageValue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </StatsCard>
      </Grid>

      {/* Excess Statistics */}
      <Grid item xs={12} md={6}>
        <StatsCard sx={{ '--accent-color': '#F59E0B' }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Excess Parts
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Count</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {summary?.excessCount?.toLocaleString() || '0'}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">Value</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                  ₹ {summary?.excessValue?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </StatsCard>
      </Grid>

      {/* Value Statistics */}
      <Grid item xs={12}>
        <ProfessionalCard>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, color: primaryColor, fontWeight: 700 }}>
              Valuation Summary
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, borderRight: { md: '1px solid #E5E7EB' } }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    NDP Before Audit
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: primaryColor }}>
                    ₹ {summary?.ndpBefore?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, borderRight: { md: '1px solid #E5E7EB' } }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    NDP After Audit
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981' }}>
                    ₹ {summary?.ndpAfter?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2, borderRight: { md: '1px solid #E5E7EB' } }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    MRP After Audit
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#8B5CF6' }}>
                    ₹ {summary?.mrpAfter?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Value Difference
                  </Typography>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700, 
                    color: ((summary?.ndpAfter || 0) - (summary?.ndpBefore || 0)) >= 0 ? '#10B981' : '#EF4444' 
                  }}>
                    {((summary?.ndpAfter || 0) - (summary?.ndpBefore || 0)) >= 0 ? '+' : ''}
                    ₹ {Math.abs((summary?.ndpAfter || 0) - (summary?.ndpBefore || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </ProfessionalCard>
      </Grid>

      {/* Line Items Statistics */}
      <Grid item xs={12} md={6}>
        <ProfessionalCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ bgcolor: alpha('#3B82F6', 0.1), color: '#3B82F6', mr: 2 }}>
                <TrendingUp />
              </Avatar>
              <Typography variant="h6">Audit Statistics</Typography>
            </Box>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Line Items Counted</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {summary?.lineItemsDup?.toLocaleString() || '0'}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Unique Line Items</Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {summary?.lineItemsUnique?.toLocaleString() || '0'}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">Extras Found</Typography>
                <Chip 
                  label={summary?.extrasUnique?.toLocaleString() || '0'} 
                  color="warning" 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </Stack>
          </CardContent>
        </ProfessionalCard>
      </Grid>
    </Grid>
  </Box>
)}


            {/* TVS Template Section */}
            <Box sx={{ mt: 6 }}>
              <Divider sx={{ mb: 4 }}>
                <Chip label="TVS Template Generator" sx={{ px: 3, py: 1 }} />
              </Divider>

              <ProfessionalCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha('#F59E0B', 0.1), 
                      color: '#F59E0B',
                      mr: 2,
                      width: 56,
                      height: 56
                    }}>
                      <Description sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" gutterBottom sx={{ color: primaryColor, fontWeight: 700 }}>
                        TVS Template Generator
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate a formatted template for TVS system integration
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    {/* Step 1: Upload After File */}
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: primaryColor }}>
                          Step 1: Upload After File for TVS Template (Optional)
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          p: 3, 
                          border: '2px dashed',
                          borderColor: '#E5E7EB',
                          borderRadius: 2,
                          mt: 2,
                          '&:hover': { borderColor: primaryColor }
                        }}>
                          <ActionButton 
                            variant="outlined" 
                            component="label"
                            startIcon={<CloudUpload />}
                            sx={{ borderColor: primaryColor, color: primaryColor }}
                          >
                            Select TVS After File
                            <input
                              ref={tvsAfterInputRef}
                              type="file"
                              hidden
                              accept=".xlsx, .xls"
                              onClick={e => { e.target.value = null; }}
                              onChange={(e) => handleFileUpload(e, 'tvsAfter')}
                            />
                          </ActionButton>
                          {tvsAfterFileName && (
                            <Chip
                              label={tvsAfterFileName}
                              color="primary"
                              variant="outlined"
                              onDelete={() => clearFile('tvsAfter')}
                              sx={{ maxWidth: 400 }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Upload the post-adjustment file (same format as Physical) to subtract quantities from the TVS template.
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Step 2: Enter IDs */}
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: primaryColor }}>
                          Step 2: Enter Configuration IDs
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} sm={6} md={3}>
                            <TextField 
                              fullWidth 
                              label="DEALER_ID" 
                              value={dealerId} 
                              onChange={(e) => setDealerId(e.target.value)} 
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <TextField 
                              fullWidth
                              label="BRANCH_ID" 
                              value={branchId} 
                              onChange={(e) => setBranchId(e.target.value)} 
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <TextField 
                              fullWidth
                              label="MANUFACTURER_ID" 
                              value={manufacturerId} 
                              onChange={(e) => setManufacturerId(e.target.value)} 
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12} sm={6} md={3}>
                            <TextField 
                              fullWidth
                              label="TAXABLE" 
                              value={taxable} 
                              onChange={(e) => setTaxableId(e.target.value)} 
                              variant="outlined"
                              placeholder="Y"
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {/* Step 3: Generate */}
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 3, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: primaryColor, textAlign: 'center' }}>
                          Step 3: Generate Template
                        </Typography>
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                          <ActionButton
                            variant="contained"
                            size="large"
                            onClick={generateTvsTemplate}
                            disabled={!physicalData}
                            startIcon={<Assessment />}
                            sx={{ 
                              backgroundColor: '#F59E0B',
                              '&:hover': { backgroundColor: '#D97706' }
                            }}
                          >
                            Generate TVS Template
                          </ActionButton>
                          <ActionButton 
                            variant="outlined"
                            onClick={downloadTvsTemplate} 
                            disabled={!tvsTemplateData} 
                            startIcon={<Download />}
                            sx={{ borderColor: '#10B981', color: '#10B981' }}
                          >
                            Download TVS Template
                          </ActionButton>
                          <ActionButton 
                            variant="outlined" 
                            color="error" 
                            onClick={clearTvsTemplate} 
                            startIcon={<Delete />}
                          >
                            Clear TVS Inputs
                          </ActionButton>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </ProfessionalCard>

              {/* TVS Template Data Grid */}
              {tvsTemplateData && (
                <Box sx={{ mt: 4 }}>
                  <Paper elevation={0} sx={{ height: 400, mb: 3, borderRadius: 2 }}>
                    <StyledDataGrid
                      rows={tvsTemplateData.slice(1).map((row, index) => {
                        const rowObj = { id: index + 1 };
                        tvsTemplateData[0].forEach((header, i) => {
                          rowObj[header] = row[i];
                        });
                        return rowObj;
                      })}
                      columns={tvsTemplateData[0].map(header => ({
                        field: header,
                        headerName: header,
                        flex: 1,
                        editable: header === 'STOCK' || header === 'TAXABLE',
                      }))}
                      density="compact"
                      processRowUpdate={(newRow, oldRow) => {
                        const partNo = newRow.SPARE_PART_NO;
                        const rack = newRow.RACK;
                        const newQuantity = parseFloat(newRow.STOCK) || 0;

                        const rowIndex = tvsTemplateData.findIndex(
                          (row, idx) => idx > 0 && row[2] === partNo && row[5] === rack
                        );

                        if (rowIndex > 0) {
                          handleTvsStockEdit(partNo, rack, newQuantity, rowIndex);
                        }
                        return newRow;
                      }}
                      onProcessRowUpdateError={(err) => console.error(err)}
                    />
                  </Paper>

                  {/* TVS Template Total */}
                  <ProfessionalCard sx={{ mb: 3 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: alpha(primaryColor, 0.1), color: primaryColor, mr: 2 }}>
                            <Inventory />
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Total Stock in TVS Template
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ color: primaryColor, fontWeight: 700 }}>
                          {formatNumber(tvsStockTotal)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </ProfessionalCard>

                  {/* Stock Comparison Check */}
                  {reportData && reportData.length > 1 && (
                    <Alert 
                      severity={Math.abs(reportData[1][4] - tvsStockTotal) <= 0.01 ? "success" : "warning"}
                      sx={{ mb: 3 }}
                      icon={Math.abs(reportData[1][4] - tvsStockTotal) <= 0.01 ? <CheckCircle /> : <Warning />}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Stock Total Comparison
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                          <Typography variant="body2">
                            Report Physical Total: <strong>{formatNumber(reportData[1][4])}</strong>
                          </Typography>
                          <Typography variant="body2">
                            TVS Template Total: <strong>{formatNumber(tvsStockTotal)}</strong>
                          </Typography>
                          <Chip 
                            label={Math.abs(reportData[1][4] - tvsStockTotal) <= 0.01 ? "Totals Match" : "Totals Don't Match"} 
                            color={Math.abs(reportData[1][4] - tvsStockTotal) <= 0.01 ? "success" : "error"} 
                            size="small"
                          />
                        </Box>
                      </Box>
                    </Alert>
                  )}

                  {/* Unmatched Entries Alerts */}
                  {(unmatchedEntries.mismatchedRack.length > 0 || unmatchedEntries.emptyRack.length > 0 || unmatchedEntries.partNotFound.length > 0) && (
                    <Box sx={{ mt: 4 }}> {/* Added Box for spacing and grouping */}
                      {unmatchedEntries.mismatchedRack.length > 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Mismatched Rack Locations (No Subtraction Applied)
                          </Typography>
                          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#FEF3C7' }}>
                                  <TableCell><strong>Part No</strong></TableCell>
                                  <TableCell><strong>Wrong Rack</strong></TableCell>
                                  <TableCell><strong>Quantity</strong></TableCell>
                                  <TableCell><strong>Available Racks</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {unmatchedEntries.mismatchedRack.map((row, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{row.partNo}</TableCell>
                                    <TableCell sx={{ color: '#EF4444' }}>{row.wrongRack}</TableCell>
                                    <TableCell>{row.quantity}</TableCell>
                                    <TableCell sx={{ color: '#10B981' }}>{row.availableRacks}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Alert>
                      )}

                      {unmatchedEntries.emptyRack.length > 0 && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Empty Rack in After File (No Subtraction Applied)
                          </Typography>
                          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#DBEAFE' }}>
                                  <TableCell><strong>Part No</strong></TableCell>
                                  <TableCell><strong>Quantity</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {unmatchedEntries.emptyRack.map((row, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{row.partNo}</TableCell>
                                    <TableCell>{row.quantity}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Alert>
                      )}

                      {/* The new button for applying unmatched quantities */}
                      {(unmatchedEntries.mismatchedRack.length > 0 || unmatchedEntries.emptyRack.length > 0) && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 3 }}> {/* Align button to right */}
                              <ActionButton
                                  variant="contained"
                                  onClick={() => applyUnmatchedQuantities(unmatchedEntries)}
                                  startIcon={<CompareArrows />} // Using CompareArrows, or choose another icon
                                  sx={{
                                      backgroundColor: '#FF5722', // A distinctive color for this action
                                      '&:hover': { backgroundColor: '#E64A19' },
                                      color: 'white',
                                      px: 3,
                                      py: 1.5,
                                      fontSize: '0.95rem',
                                      fontWeight: 600
                                  }}
                              >
                                  Apply Mismatched/Empty to Highest Stock Rack
                              </ActionButton>
                          </Box>
                      )}

                      {unmatchedEntries.partNotFound.length > 0 && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Part Not Found in Physical Stock (No Subtraction Applied)
                          </Typography>
                          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#FEE2E2' }}>
                                  <TableCell><strong>Part No</strong></TableCell>
                                  <TableCell><strong>Rack</strong></TableCell>
                                  <TableCell><strong>Quantity</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {unmatchedEntries.partNotFound.map((row, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell sx={{ color: '#EF4444' }}>{row.partNo}</TableCell>
                                    <TableCell>{row.rack}</TableCell>
                                    <TableCell>{row.quantity}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        )}
        {/* Incomplete Subtraction Parts Alert */}
{incompleteParts.length > 0 && (
  <Alert severity="error" sx={{ mb: 2 }}>
    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
      Parts with Incomplete or Ambiguous Subtractions
    </Typography>
    <Typography variant="body2" sx={{ mb: 2 }}>
      These parts could not be fully processed due to insufficient stock in highest rack or ambiguous rack selection:
    </Typography>
    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: '#FEE2E2' }}>
            <TableCell><strong>Part No</strong></TableCell>
            <TableCell><strong>Requested Qty</strong></TableCell>
            <TableCell><strong>Actually Subtracted</strong></TableCell>
            <TableCell><strong>Remaining</strong></TableCell>
            <TableCell><strong>Available Stock</strong></TableCell>
            <TableCell><strong>Issue</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {incompleteParts.map((part, idx) => (
            <TableRow key={idx}>
              <TableCell sx={{ fontWeight: 'bold', color: '#EF4444' }}>
                {part.partNo}
              </TableCell>
              <TableCell>{part.requestedQty}</TableCell>
              <TableCell sx={{ color: '#10B981' }}>{part.actualSubtracted}</TableCell>
              <TableCell sx={{ 
                color: part.remainingQty > 0 ? '#EF4444' : '#6B7280',
                fontWeight: part.remainingQty > 0 ? 'bold' : 'normal'
              }}>
                {part.remainingQty}
              </TableCell>
              <TableCell>{part.totalAvailable}</TableCell>
              <TableCell sx={{ fontSize: '0.875rem' }}>
                {part.issue}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    
    {/* Clear button for incomplete parts */}
    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
      <ActionButton
        variant="outlined"
        size="small"
        onClick={() => setIncompleteParts([])}
        startIcon={<Delete />}
      >
        Clear Alerts
      </ActionButton>
    </Box>
  </Alert>
)}

        {/* Final Download All Button */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 6,
          pb: 4 
        }}>
          <Zoom in={!!reportData}>
            <ActionButton
              variant="contained"
              size="large"
              startIcon={<Download />}
              onClick={downloadAllExcel}
              disabled={!reportData}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                backgroundColor: '#8B5CF6',
                '&:hover': { backgroundColor: '#7C3AED' },
                boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.4)',
              }}
            >
              DOWNLOAD ALL FILES
            </ActionButton>
          </Zoom>
        </Box>
      </Container>
    </Box>
  );
};

export default StockComparison;
