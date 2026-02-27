// import React from 'react'

// export default function ScrollNavBar() {
//   const scrollTo = (id) => {
//     const el = document.getElementById(id)
//     if (el) {
//       el.scrollIntoView({ behavior: 'smooth', block: 'start' })
//     }
//   }

//   return (
//     <div
//       style={{
//         position: 'sticky',
//         top: 64, // sits nicely below main navbar
//         zIndex: 90,
//         background: '#f8f5ef', // 🌸 cream background
//         borderBottom: '1px solid #e7e2d8',
//         padding: '10px 0',
//         display: 'flex',
//         justifyContent: 'center', // ✅ CENTER BUTTONS
//         gap: '16px',
//       }}
//     >
//       {[
//         { id: 'live-trends', label: 'Live Trends' },
//         { id: 'alerts', label: 'Alerts' },
//         { id: 'location', label: 'Location' },
//         { id: 'contacts', label: 'Contacts' },
//       ].map(item => (
//         <button
//           key={item.id}
//           onClick={() => scrollTo(item.id)}
//           style={{
//             background: '#ffffff',
//             border: '1px solid #d6d3cb',
//             borderRadius: '999px',
//             padding: '6px 14px',
//             fontSize: '12px',
//             fontWeight: 500,
//             color: '#334155',
//             cursor: 'pointer',
//           }}
//         >
//           {item.label}
//         </button>
//       ))}
//     </div>
//   )
// }
