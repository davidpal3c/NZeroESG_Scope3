

// export default function MessageBubble({ role, content, timestamp }: Message) {
//     return(
//         <div
//             key={idx}
//             className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
//         >
//             <div
//             className={`max-w-[80%] px-4 py-2 rounded-2xl ${
//                 msg.role === 'user'
//                 ? 'bg-indigo-200 text-right'
//                 : 'bg-emerald-200 text-left'
//             }`}
//             >
//                 <strong className="block text-indigo-800 text-xs mb-1">
//                     {msg.role === 'user' ? 'You' : 'Agent'}
//                 </strong>
//                 <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.content}</div>

//                 <div className="text-xs text-slate-700 opacity-60 mt-2">
//                     {msg.timestamp.toLocaleTimeString([], {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                     })}
//                 </div>
//             </div>
//             <div ref={messagesEndRef}></div>
//         </div>
// );
// }