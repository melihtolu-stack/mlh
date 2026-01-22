import { Contact } from "@/data/contacts";

interface ChatProfileCardProps {
  contact: Contact;
}

export default function ChatProfileCard({ contact }: ChatProfileCardProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-5">
        {/* Header Section */}
        <div className="flex items-start gap-5 mb-5">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
            {contact.profilePhoto && (
              <img
                src={contact.profilePhoto}
                alt={contact.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 mb-1 truncate">
              {contact.name}
            </h2>
            <p className="text-sm text-secondary">Customer Profile</p>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-4">
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-secondary mb-1">Phone</p>
                <p className="text-sm font-medium text-gray-900">{contact.phone}</p>
              </div>
              <div>
                <p className="text-xs text-secondary mb-1">Country</p>
                <p className="text-sm font-medium text-gray-900">{contact.country}</p>
              </div>
              <div>
                <p className="text-xs text-secondary mb-1">Language</p>
                <p className="text-sm font-medium text-gray-900">{contact.language}</p>
              </div>
              <div>
                <p className="text-xs text-secondary mb-1">Sector</p>
                <p className="text-sm font-medium text-gray-900">{contact.sector}</p>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-3">
              Activity
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-secondary mb-1">Last Contact</p>
                <p className="text-sm font-medium text-gray-900">{contact.lastContactDate}</p>
              </div>
              <div>
                <p className="text-xs text-secondary mb-1">Orders</p>
                <p className="text-sm font-medium text-gray-900">{contact.orderHistoryCount}</p>
              </div>
            </div>
            {contact.hasCommercialHistory && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-lg">
                <span className="text-xs font-medium">Has commercial history</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
