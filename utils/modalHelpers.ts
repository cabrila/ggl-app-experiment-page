import { openModal } from "@/components/modals/ModalManager"

export function openBookAuditionModal(preselectedCharacters?: string[], preselectedActors?: string[]) {
  openModal("bookAudition", {
    preselectedCharacters: preselectedCharacters || [],
    preselectedActors: preselectedActors || [],
  })
}

export function openBookAuditionModalFromContext(
  dispatch: any,
  preselectedCharacters?: string[],
  preselectedActors?: string[],
) {
  dispatch({
    type: "OPEN_MODAL",
    payload: {
      type: "bookAudition",
      props: {
        preselectedCharacters: preselectedCharacters || [],
        preselectedActors: preselectedActors || [],
      },
    },
  })
}
