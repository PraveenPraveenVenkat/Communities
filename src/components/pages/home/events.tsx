'use client';
import React, { useEffect, useRef, useState } from 'react';
import eventsJson from '../../../data/events.json';
import { MapPin } from '@phosphor-icons/react';
import EmptyEventCard from '../../no-events-card';
import Image from 'next/image';
import AddToCalendar from '@/components/AddToCalendar';

type Event = {
  communityName: string;
  communityLogo: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventTime: string;
  eventLink: string;
  location: string;
};

type EventCardProps = {
  communityName: string;
  title: string;
  date: string;
  location: string;
  venue: string;
  time: string;
  link: string;
  logo?: string;
  isMonthly: boolean;
};

const Events = () => {
  const [monthlyCardHeight, setMonthlyCardHeight] = useState<number>(0);
  const [upcomingCardHeight, setUpcomingCardHeight] = useState<number>(0);
  const [events, setEvents] = useState<Event[]>([]);
  // Create a date object for start of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create a date object for end of today
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // gets the events.json file from network so that there need not be a manual deploy for each event
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      fetch(
        'https://raw.githubusercontent.com/FOSSUChennai/Communities/refs/heads/main/src/data/events.json'
      )
        .then((response) => {
          if (!response.ok) {
            // If the fetch fails or in development mode, use the local eventsJson
            setEvents(eventsJson);
            return null;
          }
          return response.json();
        })
        .then((json) => setEvents(json));
    } else {
      // In development, use the local eventsJson directly
      setEvents(eventsJson);
    }
  }, []);

  // sorts all events first rather than grouping into two types and then sorting
  const sortedEvents = events.sort(
    (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const monthlyEvents = sortedEvents.filter((event) => {
    const eventDate = new Date(event.eventDate);

    return (
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate >= today
    );
  });

  const upcomingEvents = sortedEvents.filter((event) => {
    const eventDate = new Date(event.eventDate);
    return (
      eventDate > endOfToday && // Compare with end of today
      (eventDate.getMonth() !== today.getMonth() || eventDate.getFullYear() !== today.getFullYear())
    );
  });

  const calculateMaxHeight = (events: Event[]) => {
    if (events.length === 0) return 100;
    const longestTitle = events.reduce((max, event) => {
      return event.eventName.length > max.length ? event.eventName : max;
    }, '');
    const baseHeight = 24;
    const charsPerLine = 35;
    const lines = Math.ceil(longestTitle.length / charsPerLine);
    return Math.max(100, lines * baseHeight);
  };

  useEffect(() => {
    setMonthlyCardHeight(calculateMaxHeight(monthlyEvents));
    setUpcomingCardHeight(calculateMaxHeight(upcomingEvents));
  }, [monthlyEvents, upcomingEvents]);

  const EventCard: React.FC<EventCardProps> = ({
    communityName,
    title,
    date,
    location,
    venue,
    time,
    link,
    logo,
    isMonthly
  }) => {
    const [mousePosition, setMousePosition] = React.useState<{
      x: number;
      y: number;
    } | null>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const communityNameRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      const checkOverflow = () => {
        if (communityNameRef.current) {
          setIsOverflowing(
            communityNameRef.current.scrollWidth > communityNameRef.current.clientWidth
          );
        }
      };

      checkOverflow();
      window.addEventListener('resize', checkOverflow);
      return () => window.removeEventListener('resize', checkOverflow);
    }, [communityName]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const validateAndFormatVenue = (venue: string): string => {
      // Trim extra spaces and convert to Proper Case
      return venue
        .trim()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const handleMouseLeave = () => {
      setMousePosition(null);
    };

    return (
      <div
        className='group relative block cursor-pointer rounded-lg p-[2px] transition-all duration-300'
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className='absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100'
          style={{
            background: mousePosition
              ? `radial-gradient(150px circle at ${mousePosition.x}px ${mousePosition.y}px, rgb(74, 222, 128), transparent 70%)`
              : 'none',
            maskImage: 'linear-gradient(#000 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor'
          }}
        />
        <div className='relative h-full rounded-lg border-2 border-[rgb(229,231,235)] bg-white p-4 shadow-sm transition-shadow hover:border-[rgb(255,255,255,0.5)] hover:shadow-md'>
          <div
            className='pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-50'
            style={{
              background: mousePosition
                ? `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(74, 222, 128, 0.2), transparent 40%)`
                : 'none'
            }}
          />
          <div className='relative flex flex-wrap items-center justify-between gap-2'>
            {isOverflowing ? (
              <Tooltip content={communityName}>
                <div className='rounded-md border-2 border-black bg-white px-2 py-1 text-xs text-black'>
                  <span ref={communityNameRef} className='block max-w-[200px] truncate'>
                    {communityName}
                  </span>
                </div>
              </Tooltip>
            ) : (
              <div className='rounded-md border-2 border-black bg-white px-2 py-1 text-xs text-black'>
                <span ref={communityNameRef} className='block max-w-[200px] truncate'>
                  {communityName}
                </span>
              </div>
            )}
            {logo && (
              <Image
                src={logo}
                alt={`${title} logo`}
                width={24}
                height={24}
                className='rounded-sm object-cover filter transition-all duration-300 hover:filter-none'
              />
            )}
          </div>

          <a
            href={link}
            target='_blank'
            rel='noopener noreferrer'
            className='block'
            aria-label={`View details for ${title} event`}
          >
            <h3
              className={`mb-2 mt-3 text-xl font-medium text-black transition-all duration-300`}
              style={{
                height: `${isMonthly ? monthlyCardHeight : upcomingCardHeight}px`,
                overflow: 'hidden'
              }}
              title={title}
            >
              {title}
            </h3>

            <div className='flex-row items-center text-sm text-gray-600'>
              <div className='flex items-center space-x-2'>
                <span className={`rounded bg-green-100 px-2 py-0.5 text-xs text-green-800`}>
                  {location}
                </span>
                <span className={`rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800`}>
                  {date}
                </span>
                <span className={`rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800`}>
                  {time}
                </span>
                <AddToCalendar
                  eventTitle={title}
                  eventVenue={venue}
                  eventDate={date}
                  eventLink={link}
                />
              </div>
              <div className='mt-auto flex flex-grow flex-col justify-end'>
                <span className='mt-4 flex items-start gap-1 text-xs'>
                  <MapPin size={16} className='min-w-[16px]' />{' '}
                  <span className='break-words'>{validateAndFormatVenue(venue)}</span>{' '}
                </span>
              </div>
            </div>
          </a>
        </div>
      </div>
    );
  };

  return (
    <main className='mx-4 rounded-xl bg-white p-6 md:mx-8 lg:mx-16'>
      <section>
        <h2 className='mb-3 text-lg font-normal'>
          <span className='text-[30px] font-semibold text-black'>this month</span>
        </h2>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {monthlyEvents.length > 0 ? (
            monthlyEvents.map((event, index) => (
              <EventCard
                key={index}
                communityName={event.communityName}
                location={event.location}
                title={event.eventName}
                date={event.eventDate}
                venue={event.eventVenue}
                link={event.eventLink}
                time={event.eventTime}
                logo={event.communityLogo}
                isMonthly={true}
              />
            ))
          ) : (
            <EmptyEventCard message='No events scheduled for this month' />
          )}
        </div>
      </section>

      <section className='mt-12'>
        <h2 className='mb-3 text-lg font-normal'>
          <span className='text-[30px] font-semibold text-black'>upcoming</span>
        </h2>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, index) => (
              <EventCard
                key={index}
                communityName={event.communityName}
                title={event.eventName}
                location={event.location}
                date={event.eventDate}
                venue={event.eventVenue}
                link={event.eventLink}
                time={event.eventTime}
                logo={event.communityLogo}
                isMonthly={false}
              />
            ))
          ) : (
            <EmptyEventCard message='No upcoming events scheduled' />
          )}
        </div>
      </section>
    </main>
  );
};

export default Events;

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

function Tooltip({ content, children }: TooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className='relative inline-block'>
      <div onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
        {children}
      </div>
      {showTooltip && (
        <div className='absolute -top-12 left-1/2 z-50 -translate-x-1/2 transform whitespace-nowrap rounded-md border-2 border-gray-800 bg-gray-100 px-2 py-1 text-xs text-gray-800 shadow-lg'>
          {content}
          <div className='absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform bg-gray-100' />
        </div>
      )}
    </div>
  );
}
