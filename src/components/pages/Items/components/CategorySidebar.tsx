"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Grid2X2, List, Loader2, Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MenuViewMode = "multiple" | "onePage";
type ItemsContentSource = "category" | "menu";

type CategorySidebarItem = {
  id?: string | number | null;
  name?: string | null;
};

type CategorySidebarProps = {
  activeCategoryId?: string;
  categories?: CategorySidebarItem[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  onLoadMore?: () => void;
  viewMode?: MenuViewMode;
  contentSource?: ItemsContentSource;
  showMenuSource?: boolean;
  onContentSourceChange?: (source: ItemsContentSource) => void;
  onViewModeChange?: (mode: MenuViewMode) => void;
  onCategorySelect?: (id: string) => void;
};

export function CategorySidebar({
  activeCategoryId,
  categories = [],
  loading,
  loadingMore,
  hasMore,
  search,
  onSearchChange,
  onLoadMore,
  viewMode = "multiple",
  contentSource = "category",
  showMenuSource = true,
  onContentSourceChange,
  onViewModeChange,
  onCategorySelect,
}: CategorySidebarProps) {
  const tCommon = useTranslations("items.common");
  const tSidebar = useTranslations("items.sidebar");
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const handleCategoryClick = (id: string) => {
    if (viewMode === "onePage") {
      onCategorySelect?.(String(id));
      return;
    }

    if (contentSource === "category") {
      router.push(`/items?categoryId=${id}`);
      return;
    }

    onCategorySelect?.(String(id));
  };

  useEffect(() => {
    if (!activeCategoryId) return;

    const sidebar = sidebarRef.current;
    const activeButton = categoryButtonRefs.current[String(activeCategoryId)];

    if (!sidebar || !activeButton || sidebar.scrollHeight <= sidebar.clientHeight) return;

    const sidebarRect = sidebar.getBoundingClientRect();
    const activeRect = activeButton.getBoundingClientRect();
    const safeInset = 16;

    if (activeRect.top < sidebarRect.top + safeInset) {
      sidebar.scrollTo({
        top: Math.max(0, sidebar.scrollTop + activeRect.top - sidebarRect.top - safeInset),
        behavior: "smooth",
      });
      return;
    }

    if (activeRect.bottom > sidebarRect.bottom - safeInset) {
      sidebar.scrollTo({
        top: sidebar.scrollTop + activeRect.bottom - sidebarRect.bottom + safeInset,
        behavior: "smooth",
      });
    }
  }, [activeCategoryId, categories]);

  return (
    <div
      ref={sidebarRef}
      className="custom-scrollbar min-w-0 h-[calc(100dvh-var(--storefront-sticky-offset)-1rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition-[height] duration-300 ease-out motion-reduce:transition-none"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">{tCommon("fullMenuLower")}</h2>
          <p className="mt-1 text-xs text-gray-500">{tSidebar("description")}</p>
        </div>
      </div>

      {/* CONTENT SOURCE CONTROL */}
      {showMenuSource ? (
        <div className="mb-4 rounded-2xl bg-gray-100 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => onContentSourceChange?.("category")}
            className={`flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition ${
              contentSource === "category"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
            }`}
          >
            <Grid2X2 size={15} className="shrink-0" />
            <span className="truncate">{tSidebar("byCategory")}</span>
          </button>

          <button
            type="button"
            onClick={() => onContentSourceChange?.("menu")}
            className={`flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition ${
              contentSource === "menu"
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500 hover:bg-white/70 hover:text-gray-800"
            }`}
          >
            <Menu size={15} className="shrink-0" />
            <span className="truncate">{tSidebar("byMenus")}</span>
          </button>
        </div>
        </div>
      ) : null}

      {/* DISPLAY MODE CONTROL */}
      <label className="mb-4 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
          {tSidebar("displayMode")}
        </span>
        <div className="relative">
          <List
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary"
          />
          <Select
            value={viewMode}
            onValueChange={(value) =>
              onViewModeChange?.(value === "multiple" ? "multiple" : "onePage")
            }
          >
            <SelectTrigger className="h-11 w-full cursor-pointer rounded-xl border-0 bg-gray-100 pl-10 pr-10 text-sm font-semibold text-gray-800 shadow-none transition hover:bg-gray-50 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/15">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
              <SelectItem value="onePage" className="rounded-lg">
                {tSidebar("onePage")}
              </SelectItem>
              <SelectItem value="multiple" className="rounded-lg">
                {tSidebar("individual")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </label>

      {/* SEARCH */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-primary"
        />

        <input
          value={search || ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={
            contentSource === "menu"
              ? tSidebar("searchMenus")
              : tSidebar("searchCategories")
          }
          className="h-11 w-full rounded-xl bg-gray-100 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {/* LIST */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            {tSidebar("loadingCategories")}
          </div>
        ) : categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            {contentSource === "menu" ? tCommon("noMenus") : tCommon("noCategories")}
          </p>
        ) : (
          <>
            {categories.map((cat) => {
              const id = String(cat?.id || "");
              const isActive = String(activeCategoryId || "") === id;

              if (!id) return null;

              return (
                <button
                  key={id}
                  ref={(element) => {
                    categoryButtonRefs.current[id] = element;
                  }}
                  type="button"
                  onClick={() => handleCategoryClick(id)}
                  className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-full px-5 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  <span className="min-w-0 truncate">{cat.name}</span>

                  {viewMode === "onePage" && isActive ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-white" />
                  ) : null}
                </button>
              );
            })}

            {hasMore ? (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-primary px-5 py-3 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {tCommon("loadingMore")}
                  </>
                ) : (
                  contentSource === "menu"
                    ? tSidebar("loadMoreMenus")
                    : tSidebar("loadMoreCategories")
                )}
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
