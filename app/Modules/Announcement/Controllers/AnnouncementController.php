<?php

namespace App\Modules\Announcement\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Announcement\Models\Announcement;
use App\Modules\Announcement\Models\AnnouncementRead;
use App\Services\ActivityLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Display a listing of announcements.
     * Staff see only published, Manager+ see all (including drafts).
     */
    public function index(): Response
    {
        $user = Auth::user();
        $userId = $user->id;

        $query = Announcement::with('author')
            ->withExists(['reads as is_read' => function ($q) use ($userId) {
                $q->where('user_id', $userId);
            }]);

        // Manager+ can see drafts, Staff see only published
        if (!$user->isAdmin() && !$user->isManager()) {
            $query->published();
        }

        $announcements = $query
            ->orderByRaw("CASE WHEN priority = 'important' THEN 0 ELSE 1 END")
            ->orderByRaw("CASE WHEN published_at IS NULL THEN 0 ELSE 1 END") // Drafts first for managers
            ->orderByDesc('published_at')
            ->get();

        return Inertia::render('Announcements/Index', [
            'announcements' => $announcements,
        ]);
    }

    /**
     * Display the specified announcement.
     */
    public function show(Announcement $announcement): Response
    {
        $user = Auth::user();

        // Check if published or user is manager+
        if (!$announcement->isPublished() && !$user->isAdmin() && !$user->isManager()) {
            abort(403, 'この記事は公開されていません。');
        }

        return Inertia::render('Announcements/Show', [
            'announcement' => $announcement->load('author'),
        ]);
    }

    /**
     * Mark an announcement as read.
     */
    public function markAsRead(Announcement $announcement)
    {
        $user = Auth::user();

        AnnouncementRead::firstOrCreate(
            [
                'announcement_id' => $announcement->id,
                'user_id' => $user->id,
            ],
            [
                'read_at' => Carbon::now(),
            ]
        );

        return redirect()->back();
    }

    /**
     * Show the form for creating a new announcement (Manager+).
     */
    public function create(): Response
    {
        return Inertia::render('Announcements/Create');
    }

    /**
     * Store a newly created announcement (Manager+).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'priority' => 'required|in:normal,important',
            'published_at' => 'nullable|date',
        ]);

        $announcement = Announcement::create([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'priority' => $validated['priority'],
            'published_at' => $validated['published_at'] ?? null,
            'created_by' => Auth::id(),
        ]);

        $this->activityLog->logCreated('announcement', $announcement, "お知らせ作成: {$announcement->title}");

        return redirect()
            ->route('announcements.index')
            ->with('success', 'お知らせを作成しました。');
    }

    /**
     * Show the form for editing the specified announcement (Manager+).
     */
    public function edit(Announcement $announcement): Response
    {
        return Inertia::render('Announcements/Edit', [
            'announcement' => $announcement,
        ]);
    }

    /**
     * Update the specified announcement (Manager+).
     */
    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'priority' => 'required|in:normal,important',
            'published_at' => 'nullable|date',
        ]);

        $announcement->update([
            'title' => $validated['title'],
            'content' => $validated['content'],
            'priority' => $validated['priority'],
            'published_at' => $validated['published_at'] ?? null,
        ]);

        $this->activityLog->logUpdated('announcement', $announcement, "お知らせ更新: {$announcement->title}");

        return redirect()
            ->back()
            ->with('success', 'お知らせを更新しました。');
    }

    /**
     * Remove the specified announcement (Manager+).
     */
    public function destroy(Announcement $announcement)
    {
        $announcementTitle = $announcement->title;

        // Log before deletion to capture target_id
        $this->activityLog->logDeleted('announcement', $announcement, "お知らせ削除: {$announcementTitle}");

        $announcement->delete();

        return redirect()
            ->route('announcements.index')
            ->with('success', 'お知らせを削除しました。');
    }
}
