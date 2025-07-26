"use client";
import React from "react";

function MainComponent() {
  const [schedules, setSchedules] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createError, setCreateError] = React.useState(null);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showUpcomingOnly, setShowUpcomingOnly] = React.useState(true);
  const [viewMode, setViewMode] = React.useState("list");

  const [newSchedule, setNewSchedule] = React.useState({
    title: "",
    description: "",
    scheduled_date: "",
    is_private: false,
  });

  const { data: user, loading: userLoading } = useUser();

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/schedules/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search: searchTerm || undefined,
          upcoming_only: showUpcomingOnly,
          limit: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch schedules: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules);
      } else {
        throw new Error(data.error || "Failed to fetch schedules");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load schedules. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!userLoading && user) {
      fetchSchedules();
    }
  }, [userLoading, user, searchTerm, showUpcomingOnly]);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.title.trim()) {
      setCreateError("Please enter a title for your event");
      return;
    }
    if (!newSchedule.scheduled_date) {
      setCreateError("Please select a date and time");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/schedules/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSchedule),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create schedule: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data.success) {
        setSchedules([data.schedule, ...schedules]);
        setNewSchedule({
          title: "",
          description: "",
          scheduled_date: "",
          is_private: false,
        });
        setShowCreateForm(false);
      } else {
        throw new Error(data.error || "Failed to create schedule");
      }
    } catch (err) {
      console.error(err);
      setCreateError("Failed to create event. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (date - now) / (1000 * 60 * 60);

    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });

    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (diffInHours < 0) {
      return `${formattedDate} at ${formattedTime} (Past)`;
    } else if (diffInHours < 24) {
      return `Today at ${formattedTime}`;
    } else if (diffInHours < 48) {
      return `Tomorrow at ${formattedTime}`;
    } else {
      return `${formattedDate} at ${formattedTime}`;
    }
  };

  const getEventsByDate = () => {
    const eventsByDate = {};
    schedules.forEach((schedule) => {
      const date = new Date(schedule.scheduled_date).toDateString();
      if (!eventsByDate[date]) {
        eventsByDate[date] = [];
      }
      eventsByDate[date].push(schedule);
    });
    return eventsByDate;
  };

  const isEventToday = (dateString) => {
    const eventDate = new Date(dateString).toDateString();
    const today = new Date().toDateString();
    return eventDate === today;
  };

  const isEventUpcoming = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    return eventDate > now;
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Schedule Manager</h1>
        <p className="text-gray-400 mb-8">
          Please sign in to manage your schedule
        </p>
        <a
          href="/account/signin"
          className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          Sign In
        </a>
      </div>
    );
  }

  const eventsByDate = getEventsByDate();
  const sortedDates = Object.keys(eventsByDate).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Schedule Manager
          </h1>
          <p className="text-gray-400">
            Organize your events and stay on top of your schedule
          </p>
        </div>

        <div className="mb-8 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setViewMode(viewMode === "list" ? "calendar" : "list")
                }
                className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <i
                  className={`fas ${
                    viewMode === "list" ? "fa-calendar" : "fa-list"
                  }`}
                ></i>
                {viewMode === "list" ? "Calendar" : "List"}
              </button>

              <label className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUpcomingOnly}
                  onChange={(e) => setShowUpcomingOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-300 text-sm">Upcoming only</span>
              </label>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            New Event
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-8 bg-[#1a1a1a] border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
            <form onSubmit={handleCreateSchedule}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newSchedule.title}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, title: e.target.value })
                    }
                    placeholder="Enter event title"
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                    disabled={createLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduled_date"
                    value={newSchedule.scheduled_date}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        scheduled_date: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-gray-500 transition-colors"
                    disabled={createLoading}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newSchedule.description}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      description: e.target.value,
                    })
                  }
                  placeholder="Add event description (optional)"
                  rows="3"
                  className="w-full p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-gray-500 transition-colors"
                  disabled={createLoading}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSchedule.is_private}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        is_private: e.target.checked,
                      })
                    }
                    className="rounded"
                    disabled={createLoading}
                  />
                  <span className="text-gray-300 text-sm">Private event</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewSchedule({
                        title: "",
                        description: "",
                        scheduled_date: "",
                        is_private: false,
                      });
                      setCreateError(null);
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors duration-200"
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createLoading ||
                      !newSchedule.title.trim() ||
                      !newSchedule.scheduled_date
                    }
                    className="bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    {createLoading ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </div>

              {createError && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
                  {createError}
                </div>
              )}
            </form>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-calendar-alt text-4xl text-gray-600 mb-4"></i>
            <p className="text-gray-400 text-lg">No events scheduled</p>
            <p className="text-gray-500 text-sm mb-6">
              Create your first event to get started
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Create Event
            </button>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`bg-[#1a1a1a] border rounded-lg p-6 ${
                  isEventToday(schedule.scheduled_date)
                    ? "border-blue-500 bg-blue-900/10"
                    : isEventUpcoming(schedule.scheduled_date)
                    ? "border-gray-700"
                    : "border-gray-800 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {schedule.title}
                      </h3>
                      {schedule.is_private && (
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <i className="fas fa-lock"></i>
                          <span>Private</span>
                        </div>
                      )}
                      {isEventToday(schedule.scheduled_date) && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">
                      <i className="fas fa-clock mr-2"></i>
                      {formatDate(schedule.scheduled_date)}
                    </p>
                    {schedule.description && (
                      <p className="text-gray-300 text-sm">
                        {schedule.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateString) => {
              const date = new Date(dateString);
              const isToday = date.toDateString() === new Date().toDateString();
              const dayEvents = eventsByDate[dateString];

              return (
                <div
                  key={dateString}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <h2
                      className={`text-xl font-semibold ${
                        isToday ? "text-blue-400" : "text-white"
                      }`}
                    >
                      {date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h2>
                    {isToday && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        Today
                      </span>
                    )}
                    <span className="text-gray-500 text-sm">
                      {dayEvents.length} event
                      {dayEvents.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dayEvents.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-medium text-white">
                                {schedule.title}
                              </h3>
                              {schedule.is_private && (
                                <i className="fas fa-lock text-gray-500 text-sm"></i>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-2">
                              {new Date(
                                schedule.scheduled_date
                              ).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </p>
                            {schedule.description && (
                              <p className="text-gray-300 text-sm">
                                {schedule.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;