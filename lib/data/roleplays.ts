import { RoleplayScenario } from '@/lib/types/roleplay';

/**
 * Roleplay Scenarios
 * Predefined conversation scenarios for voice roleplay practice
 */

export const roleplays: RoleplayScenario[] = [
  // LIFE CATEGORY
  {
    id: 'general',
    title: 'General',
    description: 'Practice general conversation',
    difficulty: 'Beginner',
    emoji: '💬',
    category: 'life',
    userRole: 'You',
    aiRole: 'AI',
    scenario: 'You and the AI engage in a general conversation about anything',
  },
  {
    id: 'life-intro-1',
    title: 'Introductions',
    description: 'Practice introducing yourself',
    difficulty: 'Beginner',
    emoji: '👋',
    category: 'life',
    userRole: 'New Friend',
    aiRole: 'New Friend',
    scenario:
      'Two people meet for the first time at a social gathering and introduce themselves to each other',
  },
  {
    id: 'life-friends-1',
    title: 'Making Friends',
    description: 'Learn how to make new friends',
    difficulty: 'Beginner',
    emoji: '🤝',
    category: 'life',
    userRole: 'New Acquaintance',
    aiRole: 'Friendly Person',
    scenario:
      'Two people who just met are trying to get to know each other better and find common interests',
  },
  {
    id: 'life-emotions-1',
    title: 'Basic Emotions',
    description: 'Express how you feel',
    difficulty: 'Beginner',
    emoji: '😊',
    category: 'life',
    userRole: 'Friend',
    aiRole: 'Close Friend',
    scenario:
      'Friends share how they are feeling today and discuss their emotions',
  },
  {
    id: 'life-family-1',
    title: 'Introducing Family',
    description: 'Talk about your family members',
    difficulty: 'Beginner',
    emoji: '👨‍👩‍👧‍👦',
    category: 'life',
    userRole: 'Family Member',
    aiRole: 'Curious Friend',
    scenario:
      'You describe your family members, their relationships, and what they do',
  },
  {
    id: 'life-day-1',
    title: "How's Your Day?",
    description: 'Discuss your daily activities',
    difficulty: 'Beginner',
    emoji: '☀️',
    category: 'life',
    userRole: 'Friend',
    aiRole: 'Friend',
    scenario:
      'Two friends catch up and talk about how their day is going and what they did today',
  },
  {
    id: 'life-hobbies-1',
    title: 'Hobbies',
    description: 'Share your interests and hobbies',
    difficulty: 'Beginner',
    emoji: '🎨',
    category: 'life',
    userRole: 'Hobbyist',
    aiRole: 'Fellow Enthusiast',
    scenario:
      'People discuss their hobbies, what they enjoy doing in their free time, and why they like these activities',
  },
  {
    id: 'life-weather-1',
    title: 'Weather',
    description: 'Talk about the weather',
    difficulty: 'Beginner',
    emoji: '🌤️',
    category: 'life',
    userRole: 'Neighbor',
    aiRole: 'Neighbor',
    scenario:
      'Neighbors make small talk about the current weather, weather forecast, and how it affects their plans',
  },
  {
    id: 'life-shopping-1',
    title: 'Shopping Trip',
    description: 'Plan a shopping trip',
    difficulty: 'Intermediate',
    emoji: '🛍️',
    category: 'life',
    userRole: 'Shopper',
    aiRole: 'Shopping Companion',
    scenario:
      'Friends plan a shopping trip together, discussing what they need to buy and which stores to visit',
  },
  {
    id: 'life-doctor-1',
    title: "Doctor's Appointment",
    description: 'Describe symptoms to a doctor',
    difficulty: 'Intermediate',
    emoji: '🏥',
    category: 'life',
    userRole: 'Patient',
    aiRole: 'Doctor',
    scenario:
      'A patient visits a doctor, describes their symptoms, and asks questions about treatment',
  },
  {
    id: 'life-gym-1',
    title: 'At the Gym',
    description: 'Talk about fitness and exercise',
    difficulty: 'Beginner',
    emoji: '💪',
    category: 'life',
    userRole: 'Gym Member',
    aiRole: 'Personal Trainer',
    scenario:
      'A gym member asks a trainer for advice on exercises, workout routines, and fitness goals',
  },
  {
    id: 'life-party-1',
    title: 'Birthday Party',
    description: 'Celebrate and socialize',
    difficulty: 'Beginner',
    emoji: '🎉',
    category: 'life',
    userRole: 'Party Guest',
    aiRole: 'Birthday Person',
    scenario:
      'A guest congratulates the birthday person, gives a gift, and makes small talk at a birthday celebration',
  },
  {
    id: 'life-phone-1',
    title: 'Phone Call with Friend',
    description: 'Catch up over the phone',
    difficulty: 'Intermediate',
    emoji: '📱',
    category: 'life',
    userRole: 'Caller',
    aiRole: 'Friend',
    scenario:
      'Two friends talk on the phone, catching up on life, sharing news, and making plans to meet',
  },
  {
    id: 'life-help-1',
    title: 'Asking for Help',
    description: 'Request assistance politely',
    difficulty: 'Beginner',
    emoji: '🆘',
    category: 'life',
    userRole: 'Person Seeking Help',
    aiRole: 'Helpful Stranger',
    scenario:
      'Someone needs help with a task or problem and politely asks a stranger for assistance',
  },
  {
    id: 'life-complaint-1',
    title: 'Returning an Item',
    description: 'Complain and get a refund',
    difficulty: 'Intermediate',
    emoji: '🔄',
    category: 'life',
    userRole: 'Customer',
    aiRole: 'Store Manager',
    scenario:
      'A customer returns a defective product to a store and explains the problem to get a refund or exchange',
  },
  {
    id: 'life-pet-1',
    title: 'Talking About Pets',
    description: 'Discuss your furry friends',
    difficulty: 'Beginner',
    emoji: '🐕',
    category: 'life',
    userRole: 'Pet Owner',
    aiRole: 'Fellow Pet Owner',
    scenario:
      'Pet owners share stories about their pets, discuss pet care, and exchange tips',
  },
  {
    id: 'life-sports-1',
    title: 'Sports Discussion',
    description: 'Talk about your favorite sports',
    difficulty: 'Intermediate',
    emoji: '⚽',
    category: 'life',
    userRole: 'Sports Fan',
    aiRole: 'Sports Fan',
    scenario:
      'Sports enthusiasts discuss recent games, favorite teams, and upcoming matches',
  },
  {
    id: 'life-movie-1',
    title: 'Movies & TV Shows',
    description: 'Discuss entertainment',
    difficulty: 'Intermediate',
    emoji: '🎬',
    category: 'life',
    userRole: 'Movie Buff',
    aiRole: 'Friend',
    scenario:
      'Friends discuss movies and TV shows they recently watched, share recommendations, and talk about favorite genres',
  },
  {
    id: 'life-bank-1',
    title: 'At the Bank',
    description: 'Handle banking matters',
    difficulty: 'Intermediate',
    emoji: '🏦',
    category: 'life',
    userRole: 'Customer',
    aiRole: 'Bank Teller',
    scenario:
      'A customer visits a bank to open an account, deposit money, or ask about services',
  },
  {
    id: 'life-hairdresser-1',
    title: 'At the Hairdresser',
    description: 'Get a haircut',
    difficulty: 'Beginner',
    emoji: '💇',
    category: 'life',
    userRole: 'Customer',
    aiRole: 'Hairdresser',
    scenario:
      'A customer explains to a hairdresser what kind of haircut or style they want',
  },

  // FOOD CATEGORY
  {
    id: 'food-counting-1',
    title: 'Counting Apples',
    description: 'Practice numbers with food items',
    difficulty: 'Beginner',
    emoji: '🍎',
    category: 'food',
    userRole: 'Customer',
    aiRole: 'Fruit Seller',
    scenario:
      'A customer buys apples at a market and practices counting and discussing quantities of fruit',
  },
  {
    id: 'food-restaurant-1',
    title: 'Ordering at Restaurant',
    description: 'Practice ordering food',
    difficulty: 'Beginner',
    emoji: '🍔',
    category: 'food',
    userRole: 'Customer',
    aiRole: 'Waiter',
    scenario:
      'A customer arrives at a restaurant, looks at the menu, asks questions, and orders food from the waiter',
  },
  {
    id: 'food-grocery-1',
    title: 'Grocery Shopping',
    description: 'Buy groceries at a store',
    difficulty: 'Beginner',
    emoji: '🛒',
    category: 'food',
    userRole: 'Shopper',
    aiRole: 'Store Clerk',
    scenario:
      'A shopper looks for specific groceries and asks the store clerk for help finding items',
  },
  {
    id: 'food-recipe-1',
    title: 'Sharing Recipes',
    description: 'Exchange cooking ideas',
    difficulty: 'Intermediate',
    emoji: '👨‍🍳',
    category: 'food',
    userRole: 'Home Cook',
    aiRole: 'Cooking Enthusiast',
    scenario:
      'Two people share their favorite recipes, discuss cooking techniques, and exchange food preparation tips',
  },
  {
    id: 'food-cafe-1',
    title: 'Coffee Shop Order',
    description: 'Order drinks at a café',
    difficulty: 'Beginner',
    emoji: '☕',
    category: 'food',
    userRole: 'Customer',
    aiRole: 'Barista',
    scenario:
      'A customer orders coffee or tea at a café, specifying their preferences for size, temperature, and additions',
  },
  {
    id: 'food-fastfood-1',
    title: 'Fast Food Ordering',
    description: 'Order at a fast food restaurant',
    difficulty: 'Beginner',
    emoji: '🍟',
    category: 'food',
    userRole: 'Customer',
    aiRole: 'Cashier',
    scenario:
      'A customer orders food at a fast food restaurant, chooses a meal combo, and decides on drink size',
  },
  {
    id: 'food-complaint-1',
    title: 'Food Complaint',
    description: 'Complain about a meal',
    difficulty: 'Intermediate',
    emoji: '😣',
    category: 'food',
    userRole: 'Dissatisfied Customer',
    aiRole: 'Restaurant Manager',
    scenario:
      'A customer complains about cold food, wrong order, or poor service and requests a solution',
  },
  {
    id: 'food-recommendations-1',
    title: 'Asking for Food Recommendations',
    description: 'Get suggestions from locals',
    difficulty: 'Beginner',
    emoji: '🤔',
    category: 'food',
    userRole: 'Tourist',
    aiRole: 'Local Resident',
    scenario:
      'A tourist asks a local for restaurant recommendations and what dishes to try in the area',
  },
  {
    id: 'food-bill-1',
    title: 'Splitting the Bill',
    description: 'Divide restaurant costs',
    difficulty: 'Intermediate',
    emoji: '💳',
    category: 'food',
    userRole: 'Diner',
    aiRole: 'Friend',
    scenario:
      "Friends at a restaurant discuss how to split the bill and calculate each person's share",
  },
  {
    id: 'food-delivery-1',
    title: 'Food Delivery Order',
    description: 'Order food by phone',
    difficulty: 'Beginner',
    emoji: '🚚',
    category: 'food',
    userRole: 'Customer',
    aiRole: 'Restaurant Staff',
    scenario:
      'A customer calls a restaurant to order food for delivery, provides address, and asks about delivery time',
  },
  {
    id: 'food-cookingclass-1',
    title: 'Cooking Class',
    description: 'Learn to cook new dishes',
    difficulty: 'Intermediate',
    emoji: '👨‍🍳',
    category: 'food',
    userRole: 'Student',
    aiRole: 'Chef Instructor',
    scenario:
      "A student attends a cooking class, asks questions about techniques, and follows the chef's instructions",
  },
  {
    id: 'food-dietary-1',
    title: 'Dietary Restrictions',
    description: 'Explain food allergies',
    difficulty: 'Intermediate',
    emoji: '🥗',
    category: 'food',
    userRole: 'Customer',
    aiRole: 'Server',
    scenario:
      'A customer explains their dietary restrictions or allergies to a server and asks about menu options',
  },
  {
    id: 'food-bakery-1',
    title: 'At the Bakery',
    description: 'Buy fresh bread and pastries',
    difficulty: 'Beginner',
    emoji: '🥖',
    category: 'food',
    userRole: 'Customer',
    aiRole: 'Baker',
    scenario:
      'A customer orders bread, pastries, or a custom cake from a bakery',
  },

  // TRAVEL CATEGORY
  {
    id: 'travel-hotel-1',
    title: 'Hotel Check-in',
    description: 'Check into a hotel',
    difficulty: 'Intermediate',
    emoji: '🏨',
    category: 'travel',
    userRole: 'Tourist',
    aiRole: 'Hotel Receptionist',
    scenario:
      'A tourist arrives at a hotel and checks in, providing reservation details and requesting room preferences',
  },
  {
    id: 'travel-airport-1',
    title: 'At the Airport',
    description: 'Navigate airport procedures',
    difficulty: 'Intermediate',
    emoji: '✈️',
    category: 'travel',
    userRole: 'Passenger',
    aiRole: 'Airline Staff',
    scenario:
      'A passenger checks in for a flight, asks about luggage, gate information, and boarding procedures',
  },
  {
    id: 'travel-directions-1',
    title: 'Asking for Directions',
    description: 'Get directions in a new city',
    difficulty: 'Beginner',
    emoji: '🗺️',
    category: 'travel',
    userRole: 'Lost Tourist',
    aiRole: 'Helpful Local',
    scenario:
      'A tourist asks a local resident for directions to a landmark, restaurant, or public transportation',
  },
  {
    id: 'travel-taxi-1',
    title: 'Taking a Taxi',
    description: 'Communicate with a taxi driver',
    difficulty: 'Beginner',
    emoji: '🚕',
    category: 'travel',
    userRole: 'Passenger',
    aiRole: 'Taxi Driver',
    scenario:
      'A passenger tells a taxi driver where they want to go, asks about the fare, and makes conversation during the ride',
  },
  {
    id: 'travel-tour-1',
    title: 'Booking a Tour',
    description: 'Arrange a guided tour',
    difficulty: 'Intermediate',
    emoji: '🎫',
    category: 'travel',
    userRole: 'Tourist',
    aiRole: 'Tour Guide',
    scenario:
      'A tourist inquires about available tours, asks about prices, schedules, and what is included in the tour package',
  },
  {
    id: 'travel-customs-1',
    title: 'Going Through Customs',
    description: 'Navigate immigration',
    difficulty: 'Intermediate',
    emoji: '🛂',
    category: 'travel',
    userRole: 'Traveler',
    aiRole: 'Customs Officer',
    scenario:
      'A traveler answers questions from a customs officer about the purpose of visit, duration of stay, and items to declare',
  },
  {
    id: 'travel-luggage-1',
    title: 'Lost Luggage',
    description: 'Report missing baggage',
    difficulty: 'Intermediate',
    emoji: '🧳',
    category: 'travel',
    userRole: 'Passenger',
    aiRole: 'Airline Agent',
    scenario:
      'A passenger reports lost luggage at the airport, describes the bag, and fills out a claim form',
  },
  {
    id: 'travel-tickets-1',
    title: 'Buying Train Tickets',
    description: 'Purchase travel tickets',
    difficulty: 'Beginner',
    emoji: '🚂',
    category: 'travel',
    userRole: 'Traveler',
    aiRole: 'Ticket Agent',
    scenario:
      'A traveler buys train tickets at a station, asks about schedules, platforms, and prices',
  },
  {
    id: 'travel-carrental-1',
    title: 'Renting a Car',
    description: 'Arrange car rental',
    difficulty: 'Intermediate',
    emoji: '🚗',
    category: 'travel',
    userRole: 'Customer',
    aiRole: 'Rental Agent',
    scenario:
      'A customer rents a car, discusses insurance options, fuel policy, and pickup/return times',
  },
  {
    id: 'travel-attractions-1',
    title: 'Tourist Information',
    description: 'Ask about local sights',
    difficulty: 'Beginner',
    emoji: '🗼',
    category: 'travel',
    userRole: 'Tourist',
    aiRole: 'Information Desk Staff',
    scenario:
      'A tourist asks for information about local attractions, opening hours, and how to get there',
  },
  {
    id: 'travel-emergency-1',
    title: 'Travel Emergency',
    description: 'Handle urgent situations',
    difficulty: 'Advanced',
    emoji: '🆘',
    category: 'travel',
    userRole: 'Tourist',
    aiRole: 'Embassy Staff',
    scenario:
      'A tourist contacts their embassy after losing their passport or facing an emergency situation abroad',
  },
  {
    id: 'travel-booking-1',
    title: 'Booking Accommodation',
    description: 'Reserve a place to stay',
    difficulty: 'Intermediate',
    emoji: '🏠',
    category: 'travel',
    userRole: 'Guest',
    aiRole: 'Host',
    scenario:
      'A traveler books accommodation online or by phone, asks about amenities, location, and cancellation policy',
  },
  {
    id: 'travel-museum-1',
    title: 'At the Museum',
    description: 'Visit a museum',
    difficulty: 'Intermediate',
    emoji: '🏛️',
    category: 'travel',
    userRole: 'Visitor',
    aiRole: 'Museum Guide',
    scenario:
      'A visitor buys museum tickets, asks about exhibits, and joins a guided tour',
  },
  {
    id: 'travel-currency-1',
    title: 'Currency Exchange',
    description: 'Change money',
    difficulty: 'Beginner',
    emoji: '💱',
    category: 'travel',
    userRole: 'Traveler',
    aiRole: 'Exchange Clerk',
    scenario:
      'A traveler exchanges currency at an exchange office, asks about rates and fees',
  },

  // WORK CATEGORY
  {
    id: 'work-negotiation-1',
    title: 'Salary Negotiation',
    description: 'Negotiate job offer terms',
    difficulty: 'Advanced',
    emoji: '💼',
    category: 'work',
    userRole: 'Job-Seeker',
    aiRole: 'Recruiter',
    scenario:
      'A job seeker negotiates for a hefty salary raise in order to accept the job offer',
  },
  {
    id: 'work-interview-1',
    title: 'Job Interview',
    description: 'Practice interview skills',
    difficulty: 'Intermediate',
    emoji: '👔',
    category: 'work',
    userRole: 'Job Candidate',
    aiRole: 'Hiring Manager',
    scenario:
      'A job candidate answers questions about their experience, skills, and why they want the position',
  },
  {
    id: 'work-meeting-1',
    title: 'Team Meeting',
    description: 'Participate in work meetings',
    difficulty: 'Advanced',
    emoji: '📊',
    category: 'work',
    userRole: 'Team Member',
    aiRole: 'Project Manager',
    scenario:
      'Team members discuss project progress, share updates, and plan next steps in a collaborative meeting',
  },
  {
    id: 'work-presentation-1',
    title: 'Giving a Presentation',
    description: 'Present ideas to colleagues',
    difficulty: 'Advanced',
    emoji: '📈',
    category: 'work',
    userRole: 'Presenter',
    aiRole: 'Colleague',
    scenario:
      'An employee presents a new idea or project proposal to colleagues and answers their questions',
  },
  {
    id: 'work-email-1',
    title: 'Professional Email',
    description: 'Write business emails',
    difficulty: 'Intermediate',
    emoji: '📧',
    category: 'work',
    userRole: 'Employee',
    aiRole: 'Supervisor',
    scenario:
      'An employee needs to write a professional email to their supervisor about a work-related matter',
  },
  {
    id: 'work-firstday-1',
    title: 'First Day at Work',
    description: 'Introduce yourself to colleagues',
    difficulty: 'Beginner',
    emoji: '🆕',
    category: 'work',
    userRole: 'New Employee',
    aiRole: 'Colleague',
    scenario:
      'A new employee introduces themselves to coworkers, learns about the office, and asks questions about their role',
  },
  {
    id: 'work-timeoff-1',
    title: 'Requesting Time Off',
    description: 'Ask for vacation days',
    difficulty: 'Intermediate',
    emoji: '🏖️',
    category: 'work',
    userRole: 'Employee',
    aiRole: 'Manager',
    scenario:
      'An employee requests time off for vacation or personal reasons and discusses dates with their manager',
  },
  {
    id: 'work-review-1',
    title: 'Performance Review',
    description: 'Discuss your work performance',
    difficulty: 'Advanced',
    emoji: '📋',
    category: 'work',
    userRole: 'Employee',
    aiRole: 'Manager',
    scenario:
      'An employee has a performance review meeting, discusses achievements, challenges, and career goals',
  },
  {
    id: 'work-client-1',
    title: 'Client Phone Call',
    description: 'Speak with clients professionally',
    difficulty: 'Advanced',
    emoji: '📞',
    category: 'work',
    userRole: 'Account Manager',
    aiRole: 'Client',
    scenario:
      'An account manager calls a client to discuss project updates, address concerns, and maintain the business relationship',
  },
  {
    id: 'work-networking-1',
    title: 'Networking Event',
    description: 'Make professional connections',
    difficulty: 'Intermediate',
    emoji: '🤝',
    category: 'work',
    userRole: 'Professional',
    aiRole: 'Fellow Professional',
    scenario:
      'Professionals meet at a networking event, exchange business cards, discuss their work, and explore collaboration opportunities',
  },
  {
    id: 'work-resignation-1',
    title: 'Resigning from Job',
    description: 'Quit professionally',
    difficulty: 'Advanced',
    emoji: '👋',
    category: 'work',
    userRole: 'Resigning Employee',
    aiRole: 'Manager',
    scenario:
      'An employee formally resigns from their position, explains their reasons, and discusses the transition period',
  },
  {
    id: 'work-smalltalk-1',
    title: 'Office Small Talk',
    description: 'Chat with coworkers',
    difficulty: 'Beginner',
    emoji: '💬',
    category: 'work',
    userRole: 'Colleague',
    aiRole: 'Colleague',
    scenario:
      'Coworkers make casual conversation at the office about weekends, hobbies, or lunch plans',
  },
  {
    id: 'work-remote-1',
    title: 'Remote Work Discussion',
    description: 'Arrange work from home',
    difficulty: 'Intermediate',
    emoji: '💻',
    category: 'work',
    userRole: 'Employee',
    aiRole: 'Manager',
    scenario:
      'An employee discusses remote work arrangements, schedules, and communication expectations with their manager',
  },
  {
    id: 'work-conflict-1',
    title: 'Resolving Work Conflict',
    description: 'Handle workplace disagreements',
    difficulty: 'Advanced',
    emoji: '⚖️',
    category: 'work',
    userRole: 'Team Member',
    aiRole: 'Team Member',
    scenario:
      'Colleagues discuss and resolve a disagreement about work processes or project decisions professionally',
  },
  {
    id: 'work-training-1',
    title: 'Company Training',
    description: 'Learn new skills at work',
    difficulty: 'Intermediate',
    emoji: '📚',
    category: 'work',
    userRole: 'Trainee',
    aiRole: 'Trainer',
    scenario:
      'An employee attends a company training session, asks questions, and learns new skills or procedures',
  },
];

/**
 * Get roleplays by category
 */
export function getRoleplaysByCategory(category: string): RoleplayScenario[] {
  if (category === 'all') {
    return roleplays;
  }
  return roleplays.filter((roleplay) => roleplay.category === category);
}

/**
 * Get roleplay by ID
 */
export function getRoleplayById(id: string): RoleplayScenario | undefined {
  return roleplays.find((roleplay) => roleplay.id === id);
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  const categories = roleplays.map((r) => r.category);
  return ['all', ...Array.from(new Set(categories))];
}
