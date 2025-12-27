import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { apiClient } from '../services/apiClient';
import { useAuth } from '../services/authContext';
import Button from '../components/Button';
import { Send, User as UserIcon, Bot, Loader2, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const Contact: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Namaste! I am the RAS Currys assistant. I can help with ingredients, delivery, and pricing. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // FAQ fallback responses
  const getFallbackResponse = (question: string): string | null => {
    const q = question.toLowerCase();
    
    // Detect urgent issues that need admin attention
    const isUrgentIssue = 
      q.includes('refund') || 
      q.includes('not receive') || 
      q.includes('didn\'t receive') ||
      q.includes('missing') ||
      q.includes('wrong item') ||
      q.includes('damaged') ||
      q.includes('complaint') ||
      q.includes('issue') ||
      q.includes('problem');
    
    if (isUrgentIssue) {
      // Require login to create support tickets
      if (!user) {
        return `I understand this is urgent, but I need you to sign in first to create a support ticket. This ensures our team can contact you directly.\n\n` +
          `Please:\n` +
          `• Sign in to your account\n` +
          `• Return to this chat and describe your issue\n` +
          `• I'll create a support ticket linked to your account\n\n` +
          `For immediate assistance, contact: support@rascurrys.com`;
      }
      
      // Extract order number if present
      const orderMatch = q.match(/order[_\s#:-]*([a-z0-9_]+)/i);
      const orderNumber = orderMatch ? orderMatch[1].toUpperCase() : 'Not provided';
      
      // Create support ticket
      apiClient.createTicket({
        issueSummary: question.substring(0, 200),
        urgency: q.includes('urgent') || q.includes('emergency') ? 'HIGH' : 'MEDIUM',
        userContact: user.email || user.name || 'User',
        created_by_user_id: user.id
      }).catch(err => console.error('Failed to create ticket:', err));
      
      return `I understand this is urgent. I've created a support ticket for your issue${orderNumber !== 'Not provided' ? ` regarding order ${orderNumber}` : ''}.\n\n` +
        `Our support team will contact you within 2-4 hours. In the meantime:\n` +
        `• Check your order status in 'My Orders'\n` +
        `• For immediate assistance: support@rascurrys.com\n` +
        `• Phone: +91-XXX-XXX-XXXX\n\n` +
        `Please have your order number ready when contacting us.`;
    }
    
    if (q.includes('delivery') || q.includes('time') || q.includes('how long')) {
      return "Our typical delivery time is 30-45 minutes. For urgent orders or delivery updates, please check 'My Orders' section or contact us directly.";
    }
    if (q.includes('price') || q.includes('cost') || q.includes('₹') || q.includes('inr')) {
      return "All our prices are listed in INR on the product pages. Our curries range from ₹300-₹550 and pickles from ₹200-₹280. Special offers may apply!";
    }
    if (q.includes('order') || q.includes('track') || q.includes('status')) {
      return "You can track your order status by visiting the 'My Orders' page in your account. Each order shows real-time status updates.";
    }
    if (q.includes('ingredient') || q.includes('contain') || q.includes('allergen')) {
      return "Our curries are made with authentic Indian spices and fresh ingredients. For specific ingredient lists or allergen information, please check the product description or contact us at support@rascurrys.com.";
    }
    if (q.includes('payment') || q.includes('pay') || q.includes('paytm')) {
      return "We accept payments through Paytm gateway. All transactions are secure and you'll receive instant confirmation after successful payment.";
    }
    if (q.includes('cancel') || q.includes('refund') || q.includes('return')) {
      return "For order cancellations or refunds, please contact our support team immediately. We'll process valid requests within 24-48 hours.";
    }
    if (q.includes('spicy') || q.includes('hot') || q.includes('mild')) {
      return "Our curries come in varying spice levels. Check the product description for spice indicators. If you have specific preferences, you can mention them in the order notes.";
    }
    if (q.includes('veg') || q.includes('vegetarian') || q.includes('non-veg')) {
      return "We offer both vegetarian and non-vegetarian options. Each product is clearly labeled with its category. Filter by 'Currys' category to see all options.";
    }
    if (q.includes('help') || q.includes('support') || q.includes('contact')) {
      return "I'm here to help! You can ask me about:\n• Delivery times and tracking\n• Product pricing and ingredients\n• Payment methods\n• Order status\n\nFor complex issues, contact: support@rascurrys.com";
    }
    
    return null;
  };

  // Define the tool for notifying admins
  const notifyAdminTool = {
    name: "notifyAdmin",
    description: "Notify the admin team about a serious user issue, complaint, payment failure, or unresolved problem.",
    parameters: {
      type: 'object',
      properties: {
        issueSummary: {
          type: 'string',
          description: "A concise summary of the user's issue.",
        },
        urgency: {
          type: 'string',
          description: "The urgency level.",
          enum: ["LOW", "MEDIUM", "HIGH"]
        },
         userContact: {
          type: 'string',
          description: "User's name or contact info if available, otherwise 'Anonymous'.",
        }
      },
      required: ["issueSummary", "urgency", "userContact"],
    },
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Initialize Gemini
      const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;
      if (!apiKey || apiKey === 'your_actual_google_api_key_here') {
        // Use fallback FAQ system
        const fallbackResponse = getFallbackResponse(userMessage);
        if (fallbackResponse) {
          setMessages(prev => [...prev, { role: 'model', text: fallbackResponse }]);
        } else {
          setMessages(prev => [...prev, { 
            role: 'model', 
            text: "I'd love to help! I can answer questions about:\n\n• Delivery times (30-45 mins)\n• Product pricing (₹200-₹550)\n• Order tracking\n• Ingredients & allergens\n• Payment methods\n• Refunds & issues (will create support ticket)\n\nFor other queries, please email support@rascurrys.com" 
          }]);
        }
        setIsLoading(false);
        return;
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      const chat = ai.chats.create({
        model: 'gemini-2.0-flash-exp',
        config: {
            systemInstruction: "You are a warm, professional, and appetizing customer support agent for 'RAS Currys'. We sell authentic Currys and Pickles. \n\n" +
            "Key Info:\n" +
            "- Delivery: 30-45 mins usually.\n" +
            "- Pricing: In INR.\n" +
            "- Orders: Ask users to check 'My Orders' for status.\n" +
            "- Tone: Use words like 'delicious', 'spicy', 'aromatic', 'authentic'.\n\n" +
            "Protocol for Issues:\n" +
            "- If a user is angry, has a payment failure, or a complex issue you cannot resolve, apologize and IMMEDIATELY use the `notifyAdmin` tool to alert our team.\n" +
            "- Do not ask the user to email us manually if you can use the tool.\n" +
            "- After using the tool, inform the user that support has been notified.",
            tools: [{ functionDeclarations: [notifyAdminTool] }],
        }
      });

      // 2. Build history for context (simplified)
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      // We manually add the new user message to the chat send, 
      // but in a real app we'd construct the full history or use a persistent chat object.
      // For this demo, we'll just send the new message with the tool config active.
      // A limitation here is losing history on each turn if we recreate `ai.chats.create`,
      // but sticking to the request, we will just send the current message or simple context.
      
      let result = await chat.sendMessage({ message: userMessage });
      
      // 3. Handle Function Calls
      const calls = result.functionCalls;
      
      if (calls && calls.length > 0) {
        const call = calls[0];
        if (call.name === 'notifyAdmin') {
            const { issueSummary, urgency, userContact } = call.args as any;
            
            // Execute Tool
            await apiClient.createTicket({
              issueSummary,
              urgency,
              userContact: user?.email || userContact || user?.name || 'Anonymous',
              created_by_user_id: user?.id
            });

            // Send response back to model
            const toolResponse = {
                functionResponses: [{
                    id: call.id,
                    name: call.name,
                    response: { result: "Admin notified successfully. Ticket ID generated." }
                }]
            };
            
            // Get final text
            const finalResult = await chat.sendMessage(toolResponse);
            setMessages(prev => [...prev, { role: 'model', text: finalResult.text || "Support has been notified." }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', text: result.text || "I'm sorry, I couldn't understand that." }]);
      }

    } catch (error: any) {
      console.error("Gemini Error:", error);
      
      // Try fallback FAQ first
      const fallbackResponse = getFallbackResponse(userMessage);
      if (fallbackResponse) {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: fallbackResponse
        }]);
      } else {
        let errorMessage = "I apologize, but I'm having trouble connecting to the kitchen right now. Please try again later.";
        
        // Provide more specific error messages
        if (error?.message?.includes('API key')) {
          errorMessage = "There's an issue with the API configuration. Please contact support@rascurrys.com for assistance.";
        } else if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
          errorMessage = "We're experiencing high demand right now. Please try again in a few moments or contact us directly.";
        } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
          errorMessage = "Network connection issue. Please check your internet connection and try again.";
        } else if (error?.status === 404) {
          errorMessage = "AI service temporarily unavailable. Please contact us directly for immediate assistance.";
        }
        
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: errorMessage + "\n\nIn the meantime, you can:\n• Call us: +91-XXX-XXX-XXXX\n• Email: support@rascurrys.com\n• Check 'My Orders' for order status" 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Contact & Support</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
          
          {/* Header */}
          <div className="bg-brand-600 p-4 text-white flex items-center justify-between">
             <div className="flex items-center">
                <Bot className="h-6 w-6 mr-3" />
                <div>
                  <h2 className="font-bold">RAS Assistant</h2>
                  <p className="text-brand-100 text-xs">Powered by Gemini AI</p>
                </div>
             </div>
             <div className="flex items-center text-xs bg-brand-700 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Online
             </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg: Message, idx: number) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mx-2 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-brand-100'}`}>
                    {msg.role === 'user' ? <UserIcon className="h-5 w-5 text-gray-500" /> : <Bot className="h-5 w-5 text-brand-600" />}
                  </div>

                  {/* Bubble */}
                  <div className={`p-3 rounded-lg text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-100 ml-12">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                    <span className="text-xs text-gray-500">Processing...</span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={handleSend} className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about ingredients, delivery, or help..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()} className="rounded-full px-4">
                <Send className="h-5 w-5" />
              </Button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-2">
              For immediate assistance with orders, please check your "My Orders" page.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;