/**
 * SignalLab — Verified Textbook Curriculum Dataset
 * Primary Reference: Wireless Communications and Networks (2nd Edition)
 * Author: William Stallings
 * Verified Page Count: 569 pages (PDF Page = Book Page + 10)
 */

export const TEXTBOOK_META = {
  title: "Wireless Communications and Networks",
  edition: "Second Edition",
  author: "William Stallings",
  publisher: "Pearson Prentice Hall / Pearson Education, Inc.",
  copyright: "© 2005, 2002 Pearson Education, Inc.",
  isbn: "0-13-191835-4",
  pageCount: 569,
  printPageRange: "Pages i–xiii, 1–556",
  pageOffset: 10 // PDF Page = Book Page + 10
};

export const CURRICULUM = [
  {
    partId: "part-1",
    partNumber: "ONE",
    partTitle: "TECHNICAL BACKGROUND",
    bookPage: 13,
    pdfPage: 23,
    description: "Foundational principles of signal transmission, channel capacity, switching networks, and layered protocol architectures.",
    chapters: [
      {
        id: "ch-01",
        chapterNumber: 1,
        title: "Introduction",
        bookPage: 1,
        pdfPage: 11,
        status: "foundation_staged",
        badge: "STAGED",
        description: "Evolution and landscape of modern wireless communications, cellular revolution, broadband convergence, and current technical challenges.",
        sections: [
          { id: "sec-1.1", num: "1.1", title: "Wireless Comes of Age", bookPage: 2, pdfPage: 12 },
          { id: "sec-1.2", num: "1.2", title: "The Cellular Revolution", bookPage: 3, pdfPage: 13 },
          { id: "sec-1.3", num: "1.3", title: "The Global Cellular Network", bookPage: 4, pdfPage: 14 },
          { id: "sec-1.4", num: "1.4", title: "Broadband", bookPage: 5, pdfPage: 15 },
          { id: "sec-1.5", num: "1.5", title: "Future Trends", bookPage: 5, pdfPage: 15 },
          { id: "sec-1.6", num: "1.6", title: "The Trouble with Wireless", bookPage: 7, pdfPage: 17 },
          { id: "sec-1.7", num: "1.7", title: "Outline of the Book", bookPage: 7, pdfPage: 17, subsections: ["Part One: Background", "Part Two: Wireless Communication Technology", "Part Three: Wireless Networking", "Part Four: Wireless Local Area Networks"] },
          { id: "sec-1.8", num: "1.8", title: "Internet and Web Resources", bookPage: 10, pdfPage: 20, subsections: ["Web Sites for This Book", "Other Web Sites", "USENET Newsgroups"] }
        ],
        reviewQuestionsPage: { book: 11, pdf: 21 },
        problemsCount: 0
      },
      {
        id: "ch-02",
        chapterNumber: 2,
        title: "Transmission Fundamentals",
        bookPage: 14,
        pdfPage: 24,
        status: "foundation_staged",
        badge: "STAGED",
        description: "Mathematical representations of signals, time vs frequency domain, Fourier decomposition, Nyquist/Shannon channel capacity limits, and transmission media.",
        sections: [
          { id: "sec-2.1", num: "2.1", title: "Signals for Conveying Information", bookPage: 15, pdfPage: 25, subsections: ["Time Domain Concepts", "Frequency Domain Concepts", "Relationship between Data Rate and Bandwidth"] },
          { id: "sec-2.2", num: "2.2", title: "Analog and Digital Data Transmission", bookPage: 22, pdfPage: 32, subsections: ["Analog and Digital Data", "Analog and Digital Signaling", "Analog and Digital Transmission"] },
          { id: "sec-2.3", num: "2.3", title: "Channel Capacity", bookPage: 27, pdfPage: 37, subsections: ["Nyquist Bandwidth", "Shannon Capacity Formula"] },
          { id: "sec-2.4", num: "2.4", title: "Transmission Media", bookPage: 31, pdfPage: 41, subsections: ["Terrestrial Microwave", "Satellite Microwave", "Broadcast Radio", "Infrared"] },
          { id: "sec-2.5", num: "2.5", title: "Multiplexing", bookPage: 36, pdfPage: 46, subsections: ["Frequency Division Multiplexing", "Synchronous Time Division Multiplexing"] },
          { id: "sec-2.6", num: "2.6", title: "Recommended Reading and Web Sites", bookPage: 40, pdfPage: 50 },
          { id: "sec-2.7", num: "2.7", title: "Key Terms, Review Questions, and Problems", bookPage: 41, pdfPage: 51, subsections: ["Key Terms", "Review Questions", "Problems"] }
        ],
        appendices: [
          { code: "Appendix 2A", title: "Decibels and Signal Strength", bookPage: 43, pdfPage: 53 }
        ],
        keyFormulas: [
          { name: "Continuous Sinusoid", formula: "s(t) = A \\sin(2\\pi f t + \\phi)" },
          { name: "Nyquist Capacity", formula: "C = 2B \\log_2 M" },
          { name: "Shannon Capacity", formula: "C = B \\log_2(1 + \\text{SNR})" },
          { name: "Decibel Signal Power", formula: "\\text{dB} = 10 \\log_{10}(P_2 / P_1)" }
        ]
      },
      {
        id: "ch-03",
        chapterNumber: 3,
        title: "Communication Networks",
        bookPage: 46,
        pdfPage: 56,
        status: "planned",
        badge: "PLANNED",
        description: "Network topologies (LAN/MAN/WAN), circuit switching vs packet switching mechanics, virtual channels, and ATM cell transfer.",
        sections: [
          { id: "sec-3.1", num: "3.1", title: "LANs, MANs, and WANs", bookPage: 47, pdfPage: 57 },
          { id: "sec-3.2", num: "3.2", title: "Switching Techniques", bookPage: 49, pdfPage: 59 },
          { id: "sec-3.3", num: "3.3", title: "Circuit Switching", bookPage: 50, pdfPage: 60, subsections: ["Circuit-Switching Concepts", "Routing in Circuit-Switched Networks", "Control Signaling"] },
          { id: "sec-3.4", num: "3.4", title: "Packet Switching", bookPage: 54, pdfPage: 64, subsections: ["Packet-Switching Principles", "Packet Size", "Comparison of Circuit Switching and Packet Switching", "Routing", "Congestion Control"] },
          { id: "sec-3.5", num: "3.5", title: "Asynchronous Transfer Mode", bookPage: 60, pdfPage: 70, subsections: ["ATM Architecture", "Virtual Paths and Virtual Channels", "ATM Cells", "ATM Service Categories"] },
          { id: "sec-3.6", num: "3.6", title: "Recommended Readings and Web Sites", bookPage: 65, pdfPage: 75 },
          { id: "sec-3.7", num: "3.7", title: "Key Terms, Review Questions, and Problems", bookPage: 66, pdfPage: 76 }
        ]
      },
      {
        id: "ch-04",
        chapterNumber: 4,
        title: "Protocols and the TCP/IP Suite",
        bookPage: 69,
        pdfPage: 79,
        status: "planned",
        badge: "PLANNED",
        description: "Layered protocol concepts, OSI 7-layer reference model, TCP/IP stack mechanics, datagram routing, and socket communication.",
        sections: [
          { id: "sec-4.1", num: "4.1", title: "The Need for a Protocol Architecture", bookPage: 70, pdfPage: 80 },
          { id: "sec-4.2", num: "4.2", title: "The TCP/IP Protocol Architecture", bookPage: 71, pdfPage: 81, subsections: ["The TCP/IP Layers", "Operation of TCP and IP", "TCP/IP Applications"] },
          { id: "sec-4.3", num: "4.3", title: "The OSI Model", bookPage: 75, pdfPage: 85, subsections: ["The Model", "OSI Layers"] },
          { id: "sec-4.4", num: "4.4", title: "Internetworking", bookPage: 77, pdfPage: 87, subsections: ["Routers", "Internetworking Example", "IPv6"] },
          { id: "sec-4.5", num: "4.5", title: "Recommended Readings and Web Sites", bookPage: 83, pdfPage: 93 },
          { id: "sec-4.6", num: "4.6", title: "Key Terms, Review Questions, and Problems", bookPage: 83, pdfPage: 93 }
        ],
        appendices: [
          { code: "Appendix 4A", title: "Internet Protocol", bookPage: 85, pdfPage: 95 },
          { code: "Appendix 4B", title: "Transmission Control Protocol", bookPage: 88, pdfPage: 98 },
          { code: "Appendix 4C", title: "User Datagram Protocol", bookPage: 92, pdfPage: 102 }
        ]
      }
    ]
  },
  {
    partId: "part-2",
    partNumber: "TWO",
    partTitle: "WIRELESS COMMUNICATION TECHNOLOGY",
    bookPage: 94,
    pdfPage: 104,
    description: "Physical and RF communications: antenna radiation, line-of-sight path loss, signal modulation schemes, spread spectrum, and forward error correction.",
    chapters: [
      {
        id: "ch-05",
        chapterNumber: 5,
        title: "Antennas and Propagation",
        bookPage: 95,
        pdfPage: 105,
        status: "planned",
        badge: "PLANNED",
        description: "Antenna gain, radiation patterns, atmospheric attenuation, free space loss, line-of-sight link budgets, and multipath fading dynamics.",
        sections: [
          { id: "sec-5.1", num: "5.1", title: "Antennas", bookPage: 96, pdfPage: 106, subsections: ["Radiation Patterns", "Antenna Types", "Antenna Gain"] },
          { id: "sec-5.2", num: "5.2", title: "Propagation Modes", bookPage: 101, pdfPage: 111, subsections: ["Ground Wave Propagation", "Sky Wave Propagation", "Line-of-Sight Propagation"] },
          { id: "sec-5.3", num: "5.3", title: "Line-of-Sight Transmission", bookPage: 105, pdfPage: 115, subsections: ["Attenuation", "Free Space Loss", "Noise", "The Expression Eb/N0", "Atmospheric Absorption", "Multipath", "Refraction"] },
          { id: "sec-5.4", num: "5.4", title: "Fading in the Mobile Environment", bookPage: 115, pdfPage: 125, subsections: ["Multipath Propagation", "Error Compensation Mechanisms"] },
          { id: "sec-5.5", num: "5.5", title: "Recommended Readings and Web Sites", bookPage: 122, pdfPage: 132 },
          { id: "sec-5.6", num: "5.6", title: "Key Terms, Review Questions, and Problems", bookPage: 123, pdfPage: 133 }
        ]
      },
      {
        id: "ch-06",
        chapterNumber: 6,
        title: "Signal Encoding Techniques",
        bookPage: 127,
        pdfPage: 137,
        status: "planned",
        badge: "PLANNED",
        description: "Digital modulation (ASK, FSK, PSK, QAM, MSK), analog transmission (AM, FM), and analog-to-digital digitization (PCM, Delta Modulation).",
        sections: [
          { id: "sec-6.1", num: "6.1", title: "Signal Encoding Criteria", bookPage: 129, pdfPage: 139 },
          { id: "sec-6.2", num: "6.2", title: "Digital Data, Analog Signals", bookPage: 131, pdfPage: 141, subsections: ["Amplitude-Shift Keying", "Frequency-Shift Keying", "Phase-Shift Keying", "Performance", "Minimum-Shift Keying", "Quadrature Amplitude Modulation"] },
          { id: "sec-6.3", num: "6.3", title: "Analog Data, Analog Signals", bookPage: 142, pdfPage: 152, subsections: ["Amplitude Modulation", "Angle Modulation"] },
          { id: "sec-6.4", num: "6.4", title: "Analog Data, Digital Signals", bookPage: 148, pdfPage: 158, subsections: ["Pulse Code Modulation", "Delta Modulation (DM)", "Performance"] },
          { id: "sec-6.5", num: "6.5", title: "Recommended Readings", bookPage: 155, pdfPage: 165 },
          { id: "sec-6.6", num: "6.6", title: "Key Terms, Review Questions, and Problems", bookPage: 155, pdfPage: 165 }
        ]
      },
      {
        id: "ch-07",
        chapterNumber: 7,
        title: "Spread Spectrum",
        bookPage: 159,
        pdfPage: 169,
        status: "planned",
        badge: "PLANNED",
        description: "Frequency Hopping (FHSS), Direct Sequence (DSSS), CDMA multiple access, pseudorandom noise (PN) sequences, and Walsh orthogonal coding.",
        sections: [
          { id: "sec-7.1", num: "7.1", title: "The Concept of Spread Spectrum", bookPage: 160, pdfPage: 170 },
          { id: "sec-7.2", num: "7.2", title: "Frequency Hopping Spread Spectrum", bookPage: 161, pdfPage: 171, subsections: ["Basic Approach", "FHSS Using MFSK", "FHSS Performance Considerations"] },
          { id: "sec-7.3", num: "7.3", title: "Direct Sequence Spread Spectrum", bookPage: 166, pdfPage: 176, subsections: ["DSSS Using BPSK", "DSSS Performance Considerations"] },
          { id: "sec-7.4", num: "7.4", title: "Code Division Multiple Access", bookPage: 170, pdfPage: 180, subsections: ["Basic Principles", "CDMA for Direct Sequence Spread Spectrum"] },
          { id: "sec-7.5", num: "7.5", title: "Generation of Spreading Sequences", bookPage: 173, pdfPage: 183, subsections: ["PN Sequences", "Orthogonal Codes", "Multiple Spreading"] },
          { id: "sec-7.6", num: "7.6", title: "Recommended Readings and Web Sites", bookPage: 186, pdfPage: 196 },
          { id: "sec-7.7", num: "7.7", title: "Key Terms, Review Questions, and Problems", bookPage: 186, pdfPage: 196 }
        ]
      },
      {
        id: "ch-08",
        chapterNumber: 8,
        title: "Coding and Error Control",
        bookPage: 192,
        pdfPage: 202,
        status: "planned",
        badge: "PLANNED",
        description: "Forward Error Correction (FEC), CRC error detection polynomials, linear block codes, Hamming distance, BCH & Reed-Solomon, Convolutional/Turbo coding, and ARQ protocols.",
        sections: [
          { id: "sec-8.1", num: "8.1", title: "Error Detection", bookPage: 193, pdfPage: 203, subsections: ["Parity Check", "Cyclic Redundancy Check"] },
          { id: "sec-8.2", num: "8.2", title: "Block Error Correction Codes", bookPage: 200, pdfPage: 210, subsections: ["Block Code Principles", "Hamming Code", "Cyclic Codes", "BCH Codes", "Reed-Solomon Codes", "Block Interleaving"] },
          { id: "sec-8.3", num: "8.3", title: "Convolutional Codes", bookPage: 216, pdfPage: 226, subsections: ["Decoding", "Turbo Coding"] },
          { id: "sec-8.4", num: "8.4", title: "Automatic Repeat Request", bookPage: 223, pdfPage: 233, subsections: ["Flow Control", "Error Control"] },
          { id: "sec-8.5", num: "8.5", title: "Recommended Readings", bookPage: 230, pdfPage: 240 },
          { id: "sec-8.6", num: "8.6", title: "Key Terms, Review Questions, and Problems", bookPage: 231, pdfPage: 241 }
        ]
      }
    ]
  },
  {
    partId: "part-3",
    partNumber: "THREE",
    partTitle: "WIRELESS NETWORKING",
    bookPage: 236,
    pdfPage: 246,
    description: "Wide-area wireless systems: satellite links, cellular geometry and frequency reuse, 1G/2G/3G architectures, cordless DECT, WiMAX, Mobile IP, and WAP.",
    chapters: [
      {
        id: "ch-09",
        chapterNumber: 9,
        title: "Satellite Communications",
        bookPage: 237,
        pdfPage: 247,
        status: "planned",
        badge: "PLANNED",
        description: "Geostationary and non-geostationary satellite orbits (LEO/MEO/GEO), frequency band allocations, transponder capacity, and FDMA/TDMA multiple access.",
        sections: [
          { id: "sec-9.1", num: "9.1", title: "Satellite Parameters and Configurations", bookPage: 238, pdfPage: 248, subsections: ["Satellite Orbits", "Frequency Bands", "Transmission Impairments", "Satellite Network Configurations"] },
          { id: "sec-9.2", num: "9.2", title: "Capacity Allocation-Frequency Division", bookPage: 250, pdfPage: 260, subsections: ["Frequency Division Multiplexing", "Frequency Division Multiple Access"] },
          { id: "sec-9.3", num: "9.3", title: "Capacity Allocation-Time Division", bookPage: 256, pdfPage: 266 },
          { id: "sec-9.4", num: "9.4", title: "Recommended Readings and Web Sites", bookPage: 261, pdfPage: 271 },
          { id: "sec-9.5", num: "9.5", title: "Key Terms, Review Questions, and Problems", bookPage: 262, pdfPage: 272 }
        ]
      },
      {
        id: "ch-10",
        chapterNumber: 10,
        title: "Cellular Wireless Networks",
        bookPage: 264,
        pdfPage: 274,
        status: "interactive",
        badge: "READY",
        description: "Cellular geometry, cluster sizing, frequency reuse factor, handoff mechanisms, cell splitting, 1G AMPS, 2G GSM & IS-95, and 3G CDMA2000/WCDMA evolution.",
        sections: [
          { id: "sec-10.1", num: "10.1", title: "Principles of Cellular Networks", bookPage: 265, pdfPage: 275, subsections: ["Cellular Network Organization", "Operation of Cellular Systems", "Mobile Radio Propagation Effects", "Power Control", "Traffic Engineering"] },
          { id: "sec-10.2", num: "10.2", title: "First-Generation Analog", bookPage: 282, pdfPage: 292, subsections: ["Spectral Allocation", "Operation", "AMPS Control Channels"] },
          { id: "sec-10.3", num: "10.3", title: "Second-Generation TDMA", bookPage: 285, pdfPage: 295, subsections: ["First-Generation vs Second-Generation", "Mobile Wireless TDMA Design Considerations", "Global System for Mobile Communications (GSM)", "GSM Network Architecture", "Radio Link Aspects", "TDMA Format"] },
          { id: "sec-10.4", num: "10.4", title: "Second-Generation CDMA", bookPage: 298, pdfPage: 308, subsections: ["CDMA Design Considerations", "IS-95", "IS-95 Forward Link", "IS-95 Reverse Link"] },
          { id: "sec-10.5", num: "10.5", title: "Third-Generation Systems", bookPage: 304, pdfPage: 314, subsections: ["3G Objective", "3G Wireless Transmission Technologies", "CDMA2000 1xEV-DO"] },
          { id: "sec-10.6", num: "10.6", title: "Recommended Readings and Web Sites", bookPage: 311, pdfPage: 321 },
          { id: "sec-10.7", num: "10.7", title: "Key Terms, Review Questions, and Problems", bookPage: 314, pdfPage: 324 }
        ],
        keyFormulas: [
          { name: "Cluster Reuse Factor", formula: "N = i² + j² + i·j" },
          { name: "Cochannel Reuse Distance", formula: "D = R·√(3N)  (D/d = √N)" },
          { name: "Erlang B Blocking Formula", formula: "P = (Aᴺ/N!) / ∑ₖ (Aᵏ/k!)" },
          { name: "Hata Urban Path Loss", formula: "L_dB = 69.55 + 26.16·log(fc) - 13.82·log(ht) - A(hr) + (44.9 - 6.55·log(ht))·log(d)" }
        ]
      },
      {
        id: "ch-11",
        chapterNumber: 11,
        title: "Cordless Systems and Wireless Local Loop",
        bookPage: 317,
        pdfPage: 327,
        status: "planned",
        badge: "PLANNED",
        description: "Digital Enhanced Cordless Telecommunications (DECT), Wireless Local Loop (WLL), OFDM multichannel distribution (MMDS/LMDS), and IEEE 802.16 WiMAX broadband access.",
        sections: [
          { id: "sec-11.1", num: "11.1", title: "Cordless Systems", bookPage: 318, pdfPage: 328, subsections: ["Time Division Duplex", "DECT Operation", "Adaptive Differential Pulse Code Modulation"] },
          { id: "sec-11.2", num: "11.2", title: "Wireless Local Loop", bookPage: 329, pdfPage: 339, subsections: ["The Role of WLL", "Propagation Considerations for WLL", "Orthogonal Frequency Division Multiplexing", "Multichannel Multipoint Distribution Service", "Local Multipoint Distribution Service"] },
          { id: "sec-11.3", num: "11.3", title: "WiMAX and IEEE 802.16 Broadband Wireless Access Standards", bookPage: 342, pdfPage: 352, subsections: ["IEEE 802.16 Architecture", "Services", "IEEE 802.16 MAC Layer", "IEEE 802.16 Physical Layer", "IEEE 802.16a"] },
          { id: "sec-11.4", num: "11.4", title: "Recommended Readings and Web Sites", bookPage: 354, pdfPage: 364 },
          { id: "sec-11.5", num: "11.5", title: "Key Terms, Review Questions, and Problems", bookPage: 355, pdfPage: 365 }
        ],
        appendices: [
          { code: "Appendix 11A", title: "Linear Predictive Filters", bookPage: 356, pdfPage: 366 }
        ]
      },
      {
        id: "ch-12",
        chapterNumber: 12,
        title: "Mobile IP and Wireless Access Protocol",
        bookPage: 358,
        pdfPage: 368,
        status: "planned",
        badge: "PLANNED",
        description: "Mobile IP agent discovery, registration, care-of addresses, IP-in-IP tunneling, and Wireless Application Protocol (WAP) architecture.",
        sections: [
          { id: "sec-12.1", num: "12.1", title: "Mobile IP", bookPage: 359, pdfPage: 369, subsections: ["Operation of Mobile IP", "Discovery", "Registration", "Tunneling"] },
          { id: "sec-12.2", num: "12.2", title: "Wireless Application Protocol", bookPage: 373, pdfPage: 383, subsections: ["Architectural Overview", "Wireless Application Environment", "Wireless Session Protocol", "Wireless Transaction Protocol", "Wireless Transport Layer Security", "Wireless Datagram Protocol"] },
          { id: "sec-12.3", num: "12.3", title: "Recommended Readings and Web Sites", bookPage: 394, pdfPage: 404 },
          { id: "sec-12.4", num: "12.4", title: "Key Terms, Review Questions, and Problems", bookPage: 396, pdfPage: 406 }
        ],
        appendices: [
          { code: "Appendix 12A", title: "Internet Control Message Protocol", bookPage: 397, pdfPage: 407 },
          { code: "Appendix 12B", title: "Message Authentication", bookPage: 401, pdfPage: 411 },
          { code: "Appendix 12C", title: "Service Primitives and Parameters", bookPage: 402, pdfPage: 412 }
        ]
      }
    ]
  },
  {
    partId: "part-4",
    partNumber: "FOUR",
    partTitle: "WIRELESS LANS",
    bookPage: 404,
    pdfPage: 414,
    description: "Local and personal area wireless technologies: IEEE 802.11 Wi-Fi protocol stack (MAC, PHY a/b/g), WPA security, and Bluetooth / IEEE 802.15 WPANs.",
    chapters: [
      {
        id: "ch-13",
        chapterNumber: 13,
        title: "Wireless LAN Technology",
        bookPage: 405,
        pdfPage: 415,
        status: "planned",
        badge: "PLANNED",
        description: "WLAN requirements, infrared links, spread spectrum configurations, and narrowband microwave RF.",
        sections: [
          { id: "sec-13.1", num: "13.1", title: "Overview", bookPage: 406, pdfPage: 416, subsections: ["Wireless LAN Applications", "Wireless LAN Requirements", "Wireless LAN Technology"] },
          { id: "sec-13.2", num: "13.2", title: "Infrared LANs", bookPage: 413, pdfPage: 423, subsections: ["Strengths and Weaknesses", "Transmission Techniques"] },
          { id: "sec-13.3", num: "13.3", title: "Spread Spectrum LANs", bookPage: 417, pdfPage: 427, subsections: ["Configuration", "Transmission Issues"] },
          { id: "sec-13.4", num: "13.4", title: "Narrowband Microwave LANs", bookPage: 418, pdfPage: 428, subsections: ["Licensed Narrowband RF", "Unlicensed Narrowband RF"] },
          { id: "sec-13.5", num: "13.5", title: "Recommended Readings and Web Sites", bookPage: 419, pdfPage: 429 },
          { id: "sec-13.6", num: "13.6", title: "Key Terms, Review Questions, and Problems", bookPage: 419, pdfPage: 429 }
        ]
      },
      {
        id: "ch-14",
        chapterNumber: 14,
        title: "Wi-Fi and the IEEE 802.11 Wireless LAN Standard",
        bookPage: 421,
        pdfPage: 431,
        status: "planned",
        badge: "PLANNED",
        description: "IEEE 802 architecture, 802.11 MAC framing, CSMA/CA collision avoidance, RTS/CTS handshake, 802.11a/b/g physical layers, and WPA security.",
        sections: [
          { id: "sec-14.1", num: "14.1", title: "IEEE 802 Protocol Architecture", bookPage: 422, pdfPage: 432 },
          { id: "sec-14.2", num: "14.2", title: "IEEE 802.11 Architecture and Services", bookPage: 428, pdfPage: 438 },
          { id: "sec-14.3", num: "14.3", title: "IEEE 802.11 Medium Access Control", bookPage: 433, pdfPage: 443 },
          { id: "sec-14.4", num: "14.4", title: "IEEE 802.11 Physical Layer", bookPage: 442, pdfPage: 452 },
          { id: "sec-14.5", num: "14.5", title: "Other IEEE 802.11 Standards", bookPage: 451, pdfPage: 461 },
          { id: "sec-14.6", num: "14.6", title: "Recommended Readings and Web Sites", bookPage: 458, pdfPage: 468 },
          { id: "sec-14.7", num: "14.7", title: "Key Terms, Review Questions, and Problems", bookPage: 459, pdfPage: 469 }
        ],
        appendices: [
          { code: "Appendix 14A", title: "Scrambling", bookPage: 460, pdfPage: 470 }
        ]
      },
      {
        id: "ch-15",
        chapterNumber: 15,
        title: "Bluetooth and IEEE 802.15",
        bookPage: 463,
        pdfPage: 473,
        status: "planned",
        badge: "PLANNED",
        description: "Bluetooth piconet and scatternet topologies, 2.4 GHz frequency-hop radio specifications, Link Manager Protocol (LMP), L2CAP packet adaptation, and IEEE 802.15 WPAN standards.",
        sections: [
          { id: "sec-15.1", num: "15.1", title: "Overview", bookPage: 464, pdfPage: 474 },
          { id: "sec-15.2", num: "15.2", title: "Radio Specification", bookPage: 471, pdfPage: 481 },
          { id: "sec-15.3", num: "15.3", title: "Baseband Specification", bookPage: 472, pdfPage: 482 },
          { id: "sec-15.4", num: "15.4", title: "Link Manager Protocol", bookPage: 491, pdfPage: 501 },
          { id: "sec-15.5", num: "15.5", title: "Logical Link Control and Adaptation Protocol", bookPage: 495, pdfPage: 505 },
          { id: "sec-15.6", num: "15.6", title: "IEEE 802.15", bookPage: 501, pdfPage: 511 },
          { id: "sec-15.7", num: "15.7", title: "Recommended Readings and Web Sites", bookPage: 508, pdfPage: 518 },
          { id: "sec-15.8", num: "15.8", title: "Key Terms, Review Questions, and Problems", bookPage: 509, pdfPage: 519 }
        ]
      }
    ]
  },
  {
    partId: "part-appendices",
    partNumber: "APP",
    partTitle: "APPENDICES & REFERENCE",
    bookPage: 511,
    pdfPage: 521,
    description: "Mathematical references: Erlang traffic models, Fourier analysis, and HDLC data link control protocols.",
    appendices: [
      {
        code: "Appendix A",
        title: "Traffic Analysis",
        bookPage: 511,
        pdfPage: 521,
        sections: [
          { num: "A.1", title: "Basic Traffic Concepts", bookPage: 512, pdfPage: 522 },
          { num: "A.2", title: "Multiserver Models", bookPage: 513, pdfPage: 523 },
          { num: "A.3", title: "Recommended Reading", bookPage: 519, pdfPage: 529 }
        ]
      },
      {
        code: "Appendix B",
        title: "Fourier Analysis",
        bookPage: 520,
        pdfPage: 530,
        sections: [
          { num: "B.1", title: "Fourier Series Representation of Periodic Signals", bookPage: 521, pdfPage: 531 },
          { num: "B.2", title: "Fourier Transform Representation of Aperiodic Signals", bookPage: 522, pdfPage: 532 },
          { num: "B.3", title: "Recommended Readings", bookPage: 525, pdfPage: 535 }
        ]
      },
      {
        code: "Appendix C",
        title: "Data Link Control Protocols",
        bookPage: 526,
        pdfPage: 536,
        sections: [
          { num: "C.1", title: "High-Level Data Link Control", bookPage: 527, pdfPage: 537 }
        ]
      }
    ]
  }
];
