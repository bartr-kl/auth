import Link from 'next/link';

export default function AdminDashboard() {
  const cards = [
    {
      title: 'Profiles',
      description: 'Manage user profiles including contact information and DUPR scores',
      href: '/admin/profiles',
      icon: '👤',
    },
    {
      title: 'Organizations',
      description: 'Manage organizations and their details',
      href: '/admin/orgs',
      icon: '🏢',
    },
    {
      title: 'Locations',
      description: 'Manage locations for each organization',
      href: '/admin/locations',
      icon: '📍',
    },
    {
      title: 'User Roles',
      description: 'Manage user roles and permissions across organizations',
      href: '/admin/user-roles',
      icon: '🔐',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="text-3xl">{card.icon}</div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{card.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-500">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
