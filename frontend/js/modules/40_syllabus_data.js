// ============================================================================
// SECTION: 40_syllabus_data.js
// Per-branch/year syllabus dataset
// Source: index.html lines 5043-5612 (verbatim)
// NOTE: sections share one module scope after composition — plain code, no
// imports/exports here by design. Rebuild app.js after editing.
// ============================================================================

        // ========== SYLLABUS DATA (from PDFs) ==========
        const syllabusData = {
            "cse": {
                name: "Computer Science & Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-111", name: "Web Designing-1", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human Values: Understanding Harmony", ltp: "3-1-0",
                            credits: 4 },
                        { code: "ECA-I", name: "Induction Program", ltp: "0-0-0", credits: 0 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-161", name: "Web Designing-2", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 },
                        { code: "BCS-162", name: "Design Thinking in Information & Understanding", ltp: "0-0-2",
                            credits: 0 }
                    ],
                    3: [
                        { code: "BCS-210A", name: "Discrete Structure", ltp: "3-1-0", credits: 4 },
                        { code: "BCS-211", name: "Digital Logic and Design", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-212A", name: "Object Oriented Programming through JAVA", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BCS-213", name: "Theory of Computation", ltp: "3-1-0", credits: 4 },
                        { code: "BCS-214", name: "Principles of Data Structures", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BSM-212/262", name: "Operational Research", ltp: "3-1-0", credits: 4 },
                        { code: "BCS-261", name: "Design & Analysis of Algorithms", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-262", name: "Computer Organization and Architecture", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BCS-263", name: "Database Management Systems", ltp: "3-0-2", credits: 4 }
                    ],
                    5: [
                        { code: "BHS-301/351", name: "Engineering and Managerial Economics", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCS-305", name: "Principles of Operating Systems", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-306", name: "Principles of Compiler Design", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-307", name: "Computer Networks", ltp: "3-0-2", credits: 4 }
                    ],
                    6: [
                        { code: "BMS-301/351", name: "Principles Of Industrial Management", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCS-355", name: "Software Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-361", name: "Image and Video Processing", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-356", name: "Parallel & Distributed Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-371", name: "Minor Project-I", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BCS-441", name: "Minor Project-II", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "ICS-444", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "ICS-481", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "ece": {
                name: "Electronics & Communication Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-106", name: "Electronic Components Testing and Measurement", ltp: "2-0-4",
                            credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics II", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-157", name: "Electronic Workshop", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human Values", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-170", name: "Design Thinking in Electronics & Communication Engineering",
                            ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BSM-216", name: "Applied Probability and Statistics", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-207", name: "Digital Electronics", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-208", name: "Network Theory: Analysis & Synthesis", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-209", name: "Electronic Measurement & Instrumentation", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEC-210", name: "Electronic Devices & Circuits Theory", ltp: "3-1-0", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BEC-259", name: "Electromagnetic Field Theory", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-260", name: "Signal & Systems", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-261", name: "Microprocessor and Applications", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-262", name: "Analog Integrated Circuits", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-108", name: "Intellectual Property Right", ltp: "2-0-0", credits: 0 }
                    ],
                    5: [
                        { code: "BEC-309", name: "Microwave Theory & Techniques", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-310", name: "Modern Control Systems", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-311", name: "Analog & Digital Communication", ltp: "3-0-2", credits: 4 },
                        { code: "BMS-301", name: "Principles of Industrial Management", ltp: "3-1-0", credits: 4 }
                    ],
                    6: [
                        { code: "BEC-357", name: "Embedded System and Microcontroller", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-358", name: "Optical and Wireless Communication", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-359", name: "Digital Signal Processing", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-301/351", name: "Engineering and Managerial Economics", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BEC-441", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BEC-442", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "IEC-415", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "IEC-416", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "civil": {
                name: "Civil Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-103", name: "Programming in C", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-121", name: "Engineering Graphics", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human Values", ltp: "3-1-0", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-107/157", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-161", name: "Building Planning and Drawing", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 },
                        { code: "BCE-162", name: "Design Thinking in Civil Engineering", ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BCE-210", name: "Civil Engineering Materials, Evaluation and Testing",
                            ltp: "3-0-2", credits: 4 },
                        { code: "BCE-211", name: "Soil Mechanics", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-212", name: "Structural Mechanics", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-213", name: "Basic Surveying", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-214", name: "Fluid Mechanics", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BSM-264", name: "Numerical Methods", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-261", name: "Hydraulics and Hydraulic Machines", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-262", name: "Structural Analysis", ltp: "3-1-0", credits: 4 },
                        { code: "BCE-263", name: "Highway Engineering", ltp: "3-0-2", credits: 4 }
                    ],
                    5: [
                        { code: "BCE-301", name: "Foundation Engineering", ltp: "3-1-0", credits: 4 },
                        { code: "BCE-302", name: "Water and Wastewater Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCE-303", name: "Design of Concrete Structures", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-303/353", name: "Industrial/Organizational Psychology", ltp: "3-1-0",
                            credits: 4 }
                    ],
                    6: [
                        { code: "BCE-351", name: "Design of Airport, Docks and Harbor", ltp: "3-1-0", credits: 4 },
                        { code: "BCE-352", name: "Construction Technology and Management", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCE-353", name: "Water Resources Engineering", ltp: "3-1-0", credits: 4 },
                        { code: "BMS-301/351", name: "Principles of Industrial Management", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCE-371", name: "Minor Project I", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BCE-441", name: "Minor Project- II", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "ICE-490", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "ICE-481", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "me": {
                name: "Mechanical Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics-I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BME-104", name: "Manufacturing Practice Workshop", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics-II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-103", name: "Programming in C", ltp: "3-0-2", credits: 4 },
                        { code: "BME-157", name: "Engineering Graphics with AutoCAD", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human values: understanding Harmony",
                            ltp: "3-1-0", credits: 4 },
                        { code: "BME-158", name: "Engineering Innovation & Design", ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BSM-214/264", name: "Numerical Methods", ltp: "3-0-2", credits: 4 },
                        { code: "BME-205", name: "Basics of Mechanical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BME-206", name: "Mechanics of Solids", ltp: "3-0-2", credits: 4 },
                        { code: "BME-207", name: "Material Science and Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BME-208", name: "Theory of Machines", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-102-AUC-115", name: "Value Added Course", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BME-256", name: "Software Applications for Mechanical Engineering", ltp: "2-0-4",
                            credits: 4 },
                        { code: "BME-257", name: "Fluid Mechanics & Hydraulic Machines", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BME-258", name: "Metrology and Quality Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BME-259", name: "Energy Conversion Technologies", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 }
                    ],
                    5: [
                        { code: "BME-305", name: "Design of Machine Elements", ltp: "3-0-2", credits: 4 },
                        { code: "BME-306", name: "Heat Transfer", ltp: "3-0-2", credits: 4 },
                        { code: "BME-307", name: "Manufacturing Science and Technology I", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BMS-301", name: "Principles of Industrial Management", ltp: "3-1-0", credits: 4 }
                    ],
                    6: [
                        { code: "BME-354", name: "Refrigeration and Air Conditioning", ltp: "3-0-2", credits: 4 },
                        { code: "BME-355", name: "CAD/CAM", ltp: "3-0-2", credits: 4 },
                        { code: "BME-356", name: "Manufacturing Science and Technology II", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BHS-351", name: "Engineering and Managerial Economics", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BME-390", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BME-490", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "IME-410", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "IME-411", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "chemical": {
                name: "Chemical Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics - I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-131", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-101", name: "Programming in C", ltp: "3-0-2", credits: 4 },
                        { code: "BME-101", name: "Manufacturing Techniques Workshop", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101", name: "Universal Human Values", ltp: "3-1-0", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics - II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-157", name: "Basics of Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BME-157", name: "Engineering Graphics with AutoCAD", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-152", name: "Technical Writing and Professional communication",
                            ltp: "3-0-2", credits: 4 },
                        { code: "BCH-124", name: "Creativity for Chemical Engineers", ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BPT-085", name: "Biology for Chemical Engineers", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-205", name: "Chemical Engineering Thermodynamics - I", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCH-206", name: "Process Calculation", ltp: "3-1-0", credits: 4 },
                        { code: "BCH-207", name: "Fluid Flow Operation", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-208", name: "Particulate Technology", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Basics of Artificial Intelligence", ltp: "2-0-0", credits: 0 }
                    ],
                    4: [
                        { code: "BCH-257", name: "Chemical Engineering Thermodynamics - II", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BCH-258", name: "Heat Transfer Operation", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-259", name: "Reaction Engineering - I", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-260", name: "Mass Transfer - I", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-104", name: "Indian Festivals", ltp: "2-0-0", credits: 0 }
                    ],
                    5: [
                        { code: "BCH-305", name: "Chemical Technology", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-306", name: "Reaction Engineering – II", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-307", name: "Mass Transfer – II", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-303", name: "Industrial/Organizational Psychology", ltp: "3-1-0", credits: 4 }
                    ],
                    6: [
                        { code: "BCH-354", name: "Process Equipment Design", ltp: "3-0-2", credits: 4 },
                        { code: "BCH-355", name: "Transport Phenomena", ltp: "3-1-0", credits: 4 },
                        { code: "BCH-356", name: "Process Control & Instrumentation", ltp: "3-0-2", credits: 4 },
                        { code: "BMS-352", name: "Engineering Economics and Financial Management", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BCH-371", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BCH-441", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "ICH-401", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "ICH-481", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "it": {
                name: "Information Technology",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-103/156", name: "Programming in C", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-104", name: "Internet and Web Designing", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human Values: Understanding Harmony",
                            ltp: "3-1-0", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-154", name: "Object Oriented Programming with C++", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional communication",
                            ltp: "2-1-2", credits: 4 },
                        { code: "BIT-155", name: "AC-1 (Design Thinking) Design Thinking for Software Development",
                            ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BIT-205", name: "AI Tools and Applications", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-206", name: "Java Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-207", name: "Data Structures", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-208", name: "Computer Organization & Architecture", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-211", name: "Game Theory and Applications", ltp: "3-1-0", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BSM-263", name: "Discrete Mathematics", ltp: "3-1-0", credits: 4 },
                        { code: "BIT-256", name: "Database Management System", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-257", name: "Design & Analysis of Algorithm", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-258", name: "Python Programming", ltp: "3-0-2", credits: 4 }
                    ],
                    5: [
                        { code: "BIT-305", name: "Operating System", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-306", name: "Computer Network", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-307", name: "Strategic AI with Game Theory", ltp: "3-1-0", credits: 4 },
                        { code: "BHS-301/351", name: "Engineering & Managerial Economics", ltp: "3-1-0",
                            credits: 4 }
                    ],
                    6: [
                        { code: "BIT-354", name: "Wireless Sensor Network & IoT", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-355", name: "Cryptography and Cyber Security", ltp: "3-0-2", credits: 4 },
                        { code: "BIT-356", name: "Cloud Computing", ltp: "3-0-2", credits: 4 },
                        { code: "BMS-301/351", name: "Principles of Industrial Management", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BIT-380", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BIT-450", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "IIT-410", name: "Industrial Practice (IP) (in Industry)", ltp: "0-0-20",
                            credits: 10 },
                        { code: "IIT-411", name: "Major Project (MP) (in University)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "ee": {
                name: "Electrical Engineering",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-108A", name: "Electrical Wiring & Estimation", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics II", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-159", name: "Basics of Electrical Machines & Protective Equipments",
                            ltp: "2-0-4", credits: 4 },
                        { code: "BHS-151", name: "Universal Human Values: Understanding Harmony", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BEE-161", name: "Design Thinking in Electrical Systems", ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BSM-211", name: "Complex Variables and Numerical Techniques", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BEC-207", name: "Digital Electronics", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-205", name: "Analysis of Linear Systems", ltp: "3-1-0", credits: 4 },
                        { code: "BEE-206", name: "Fundamentals of DC Electrical Machines & Transformers",
                            ltp: "3-0-2", credits: 4 },
                        { code: "BEE-207", name: "Electrical Measurement and Measuring Instruments", ltp: "3-0-2",
                            credits: 4 },
                        { code: "AUC-108", name: "Intellectual Property Right", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "3-1-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BME-260", name: "Fundamentals of Mechanical Engineering", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-256", name: "Fundamentals of AC Electrical Machines", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-257", name: "Microprocessor", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-258", name: "Network Analysis & Synthesis", ltp: "3-0-2", credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 }
                    ],
                    5: [
                        { code: "BMS-302/352", name: "Engineering Economics and Financial Management",
                            ltp: "3-1-0", credits: 4 },
                        { code: "BEE-306", name: "Power System-I", ltp: "3-1-0", credits: 4 },
                        { code: "BEE-307", name: "Control System Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-308", name: "Power Electronics", ltp: "3-0-2", credits: 4 }
                    ],
                    6: [
                        { code: "BHS-303/353", name: "Industrial/Organizational Psychology", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BEE-356", name: "Power System-II", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-357", name: "Instrumentation Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-358", name: "Switchgear & Protection", ltp: "3-0-2", credits: 4 },
                        { code: "BEE-381", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BEE-481", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "IEE-410", name: "Industrial Practice", ltp: "0-0-20", credits: 10 },
                        { code: "IEE-411", name: "Major Project", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "eceiot": {
                name: "ECE (IoT)",
                semesters: {
                    1: [
                        { code: "BSM-110", name: "Engineering Mathematics - I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-106", name: "Electronic Components Testing and Measurement", ltp: "2-0-4",
                            credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ],
                    2: [
                        { code: "BSM-160", name: "Engineering Mathematics - II", ltp: "3-1-0", credits: 4 },
                        { code: "BSC-131/181", name: "Engineering Physics", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-157", name: "Electronic Workshop", ltp: "2-0-4", credits: 4 },
                        { code: "BHS-101/151", name: "Universal Human Values (UHV)", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-170", name: "Design Thinking in Electronics & Communication Engineering",
                            ltp: "0-0-2", credits: 0 }
                    ],
                    3: [
                        { code: "BSM-216", name: "Applied Probability and Statistics", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-207", name: "Digital Electronics", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-208", name: "Network Theory: Analysis & Synthesis", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-209", name: "Electronic Measurement & Instrumentation", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEC-210", name: "Electronic Devices & Circuits Theory", ltp: "3-1-0", credits: 4 },
                        { code: "AUC-108", name: "Intellectual Property Right", ltp: "2-0-0", credits: 0 },
                        { code: "AUC-119", name: "Fundamentals of Artificial Intelligence", ltp: "2-0-0",
                            credits: 0 }
                    ],
                    4: [
                        { code: "BEC-259", name: "Electromagnetic Field Theory", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-260", name: "Signal & System", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-261", name: "Microprocessor and Applications", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-263", name: "Introduction to Arduino Uno Programming", ltp: "3-0-2",
                            credits: 4 },
                        { code: "AUC-101", name: "Constitution of India", ltp: "2-0-0", credits: 0 }
                    ],
                    5: [
                        { code: "BEC-313", name: "Embedded System Design", ltp: "3-1-0", credits: 4 },
                        { code: "BEC-314", name: "Analog and digital Circuit Design", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-315", name: "Introduction to Raspberry Pi Programming", ltp: "2-0-4",
                            credits: 4 },
                        { code: "BMS-301", name: "Principles of Industrial Management", ltp: "3-1-0", credits: 4 }
                    ],
                    6: [
                        { code: "BEC-360", name: "Digital Communication System", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-361", name: "Introduction to VLSI", ltp: "3-0-2", credits: 4 },
                        { code: "BEC-362", name: "Introduction to Deep Learning", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-301/351", name: "Engineering and Managerial Economics", ltp: "3-1-0",
                            credits: 4 },
                        { code: "BEC-451", name: "Minor Project-1", ltp: "0-0-0", credits: 0 }
                    ],
                    7: [
                        { code: "BEC-452", name: "Minor Project-2", ltp: "0-0-12", credits: 6 }
                    ],
                    8: [
                        { code: "IEC-417", name: "Industrial Practice (IP)", ltp: "0-0-20", credits: 10 },
                        { code: "IEC-418", name: "Major Project (MP)", ltp: "0-0-20", credits: 10 }
                    ]
                }
            },
            "bba": {
                name: "BBA",
                semesters: {
                    1: [
                        { code: "BBA-114", name: "Financial Accounting", ltp: "3-0-0", credits: 3 },
                        { code: "BBA-115", name: "Principles & Practices of Management", ltp: "3-0-0", credits: 3 },
                        { code: "BBA-116", name: "Quantitative Techniques for Business Research", ltp: "3-0-0",
                            credits: 3 },
                        { code: "BBA-A01", name: "Business Communication for Managers", ltp: "2-0-0", credits: 2 },
                        { code: "BHM-121", name: "Industrial Psychology / IPR", ltp: "2-0-0", credits: 2 },
                        { code: "AUC-108", name: "Ability / Value Added Course", ltp: "2-0-0", credits: 2 }
                    ],
                    2: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ]
                }
            },
            "bpharm": {
                name: "B.Pharm",
                semesters: {
                    1: [
                        { code: "BPT101T", name: "Human Anatomy, Physiology & Pathophysiology I", ltp: "3-0-0",
                            credits: 3 },
                        { code: "BPT102T", name: "Introduction to Pharmacognosy", ltp: "3-0-0", credits: 3 },
                        { code: "BPT103T", name: "Pharmaceutical Inorganic & Analytical Chemistry", ltp: "3-0-0",
                            credits: 3 },
                        { code: "BPT104T", name: "Basics of Python Programming", ltp: "2-0-0", credits: 2 },
                        { code: "BPT105T", name: "General Pharmacy", ltp: "2-0-0", credits: 2 },
                        { code: "BPT106T", name: "Healthcare Psychology & Communication Skills", ltp: "2-0-0",
                            credits: 2 },
                        { code: "BPT107P", name: "Pharmacognosy (Practical)", ltp: "0-0-2", credits: 1 },
                        { code: "BPT108P", name: "Inorganic & Analytical Chemistry (Practical)", ltp: "0-0-2",
                            credits: 1 },
                        { code: "BPT109P", name: "General Pharmacy (Practical)", ltp: "0-0-2", credits: 1 },
                        { code: "BPT110P", name: "Healthcare Psychology (Practical)", ltp: "0-0-2", credits: 1 },
                        { code: "BPT111P", name: "Anatomy & Physiology (Practical)", ltp: "0-0-2", credits: 1 }
                    ],
                    2: [
                        { code: "BSM-110", name: "Engineering Mathematics I", ltp: "3-1-0", credits: 4 },
                        { code: "BSM-140/190", name: "Environmental Science and Green Chemistry", ltp: "3-0-2",
                            credits: 4 },
                        { code: "BEE-110/160", name: "Basic Electrical Engineering", ltp: "3-0-2", credits: 4 },
                        { code: "BCS-110/160", name: "Introduction to C Programming", ltp: "3-0-2", credits: 4 },
                        { code: "BHS-102/152", name: "Technical Writing and Professional Communication",
                            ltp: "2-1-2", credits: 4 }
                    ]
                }
            }
        };
